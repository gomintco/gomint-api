import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NodeEnv } from './config/node-env.enum';
import { AppConfigService } from './config/app-config.service';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const configService = app.get(AppConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const env = configService.app.env;
  if (env === NodeEnv.DEVELOPMENT) {
    const config = new DocumentBuilder()
      .setTitle('GoMint API')
      .setDescription(
        'API for interacting with the Hedera Hashgraph network,' +
        ' including custodial key control, token creation,' +
        ' and transaction handling.',
      )
      .setVersion('1.0')
      .addTag('gomint')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(configService.app.port);
}
bootstrap();
