import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { KeyModule } from 'src/key/key.module';

@Module({
  imports: [KeyModule],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
