import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Network } from '../../app.interface';

export class CreateUserDto {
  @IsEnum(Network)
  network: Network = Network.MAINNET;

  @IsBoolean()
  withKey: boolean = false;

  @IsBoolean()
  withAccount: boolean = false;

  @IsOptional()
  @IsString()
  password: string = null;

  @IsOptional()
  @IsEmail()
  email: string = null;

  @IsOptional()
  @IsString()
  username: string = null;
}
