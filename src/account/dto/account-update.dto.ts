import { IsNotIn, IsString } from 'class-validator';
import { DealAlias } from 'src/deal/deal-alias.enum';

export class AccountUpdateDto {
  @IsString()
  @IsNotIn([DealAlias.PAYER, DealAlias.RECEIVER])
  alias: string;
}
