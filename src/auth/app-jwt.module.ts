import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from 'src/config/app-config.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: async (configService: AppConfigService) => {
        return {
          global: true,
          secret: configService.app.jwtSecret,
          signOptions: { expiresIn: configService.app.jwtExpiresIn },
        };
      },
      inject: [AppConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class AppJwtModule {}
