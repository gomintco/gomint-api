import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { KeyResponse } from 'src/user/response/key.response';
import type { Request } from 'express';
import { KeyService } from './key.service';
import { ApiTags } from '@nestjs/swagger';
import { UserKeysResponse } from './response';

@ApiTags('key')
@Controller('key')
export class KeyController {
  constructor(private readonly keyService: KeyService) {}

  @UseGuards(ApiKeyGuard)
  @Get()
  async getUserKeys(@Req() req: Request): Promise<UserKeysResponse> {
    const userId = req.user.id;
    const keys = await this.keyService.findKeysByUserId(userId);
    return { id: userId, keys: keys.map((key) => new KeyResponse(key)) };
  }
}
