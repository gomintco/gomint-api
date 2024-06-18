import { Controller, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';

@Controller('consensus')
@UseGuards(ApiKeyGuard)
export class ConsensusController {


  // post /consensus
  //
  // return {topicId}
}
