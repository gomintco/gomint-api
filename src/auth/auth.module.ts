import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { UserModule } from 'src/user/user.module';
import { AuthMediator } from './auth.mediator';
import { ApiKeyService } from './api-key.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ApiKey]), UserModule],
  providers: [AuthMediator, ApiKeyService],
  controllers: [AuthController],
  exports: [ApiKeyService],
})
export class AuthModule {}
