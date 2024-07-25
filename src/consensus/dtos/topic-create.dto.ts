import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  TOPIC_MIN_AUTO_RENEW_PERIOD,
  TOPIS_MAX_AUTO_RENEW_PERIOD,
} from '../conensus.const';

export class TopicCreateDto {
  @IsOptional()
  @IsString()
  payerId: string;

  @IsOptional()
  @IsString()
  adminKey: string;

  /**
   * Makes topic private
   */
  @IsOptional()
  @IsString()
  submitKey: string;

  @IsOptional()
  @IsString()
  topicMemo: string;

  @IsOptional()
  @IsString()
  autoRenewAccount: string;

  @IsOptional()
  @IsNumber()
  @Min(TOPIC_MIN_AUTO_RENEW_PERIOD)
  @Max(TOPIS_MAX_AUTO_RENEW_PERIOD)
  autoRenewPeriod: number;
}
