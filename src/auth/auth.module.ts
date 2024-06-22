import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { User } from 'src/user/user.entity';
import { ApiKeyGuard } from './auth.guard';
import { AppConfigService } from 'src/config/app-config.service';
import { UserModule } from 'src/user/user.module';
import { AuthMediator } from './auth.mediator';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, User]),
    JwtModule.registerAsync({
      useFactory: async (configService: AppConfigService) => ({
        global: true,
        secret: configService.app.jwtSecret,
        signOptions: { expiresIn: '600s' },
      }),
      inject: [AppConfigService],
    }),
    UserModule,
  ],
  providers: [AuthMediator, AuthService, ApiKeyGuard],
  controllers: [AuthController],
  exports: [AuthService, ApiKeyGuard],
})
export class AuthModule {}
