import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { ConfigModule } from '@nestjs/config';
import { validate } from './validation';
import { configure } from './configuration';

@Global()
@Module({
  exports: [AppConfigService],
  imports: [
    ConfigModule.forRoot({
      validate,
      load: [configure],
    }),
  ],
  providers: [AppConfigService],
})
export class AppConfigModule {}
