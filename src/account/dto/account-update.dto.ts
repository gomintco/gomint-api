import { IsNotIn, IsOptional, IsString } from 'class-validator';
import { DealAlias } from 'src/deal/deal-alias.enum';

export class AccountUpdateDto {
  @IsOptional()
  @IsString()
  @IsNotIn([DealAlias.PAYER, DealAlias.RECEIVER])
  alias: string;
}
