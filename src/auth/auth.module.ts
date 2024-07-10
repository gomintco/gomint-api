import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { AppConfigService } from 'src/config/app-config.service';
import { UserModule } from 'src/user/user.module';
import { AuthMediator } from './auth.mediator';
import { ApiKeyService } from './api-key.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    JwtModule.registerAsync({
      useFactory: async (configService: AppConfigService) => ({
        global: true,
        secret: configService.app.jwtSecret,
        signOptions: { expiresIn: configService.app.jwtExpiresIn },
      }),
      inject: [AppConfigService],
    }),
    UserModule,
  ],
  providers: [AuthMediator, ApiKeyService],
  controllers: [AuthController],
  exports: [ApiKeyService],
})
export class AuthModule {}
