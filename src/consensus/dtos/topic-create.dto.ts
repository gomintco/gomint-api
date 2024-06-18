import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TokenCreateDto {
  @IsString()
  payerId: string;

  // all of these params are optional: https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service/create-a-topic
}
