import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { KeyResponse } from 'src/user/response/key.response';
import type { Request } from 'express';
import { KeyService } from './key.service';

@Controller('key')
export class KeyController {
  constructor(private readonly service: KeyService) {}

  @UseGuards(ApiKeyGuard)
  @Get()
  async getUserKeys(
    @Req() req: Request,
  ): Promise<{ id: string; keys: KeyResponse[] }> {
    const userId = req.user.id;
    const keys = await this.service.findKeysByUserId(userId);
    return { id: userId, keys: keys.map((key) => new KeyResponse(key)) };
  }
}
