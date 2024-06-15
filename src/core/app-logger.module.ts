import { LoggerModule } from 'nestjs-pino';
import { AppConfigService } from 'src/config/app-config.service';
import { stdTimeFunctions } from 'pino';
import { randomUUID } from 'crypto';
import { NodeEnv } from '../config/node-env.enum';
import type { Request, Response } from 'express';
import type { Options } from 'pino-http';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => {
        const options = {
          genReqId: (_req) => randomUUID(),
          level:
            // debug and trace messages are not logged in production
            configService.app.env === NodeEnv.PRODUCTION ? 'info' : 'debug',
          formatters: {
            level: (label) => ({ lvl: label.toUpperCase() }),
          },
          /**
           * Using these to not log potentially sensitive data like header values.
           * Redaction also can be used to remove sensitive data using key paths.
           * See: https://getpino.io/#/docs/redaction.
           *
           * If other request data are needed to be logged, use
           *  `customReceivedObject` option instead, to log them only once.
           */
          serializers: {
            // Log request id to be able to group logs per request
            req: (req: Request) => ({ id: req.id }),
          },
          /**
           * Removes hostname and pid from logs. Remove the line below to add
           *  them back in case of horizontal scaling to be able to track from
           *  which instance was the log.
           */
          base: undefined,
          // Use isoTime instead of epoch
          timestamp: stdTimeFunctions.isoTime,
          /**
           * Put logged objects inside `payload` key
           * Strings still logged under `msg` key
           */
          nestedKey: 'payload',
          customReceivedObject: (req, _res, _val) => ({
            url: req.url,
            method: req.method,
            query: req.query,
            params: req.params,
            body: req.body,
          }),
          customReceivedMessage: (_req, _res) => 'new API request',
        } as Options<Request, Response>;

        return {
          pinoHttp: options as Options,
        };
      },
      inject: [AppConfigService],
    }),
  ],
})
export class AppLoggerModule {}
