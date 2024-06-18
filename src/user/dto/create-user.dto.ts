import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { Network } from 'src/hedera-api/network.enum';

export class CreateUserDto {
  @IsEnum(Network)
  network: Network = Network.MAINNET;

  @IsString()
  username: string;

  @IsString()
  hashedPassword: string;

  @IsString()
  @IsOptional()
  encryptionKey?: string;

  @IsOptional()
  @IsEmail()
  email: string = null;
}
