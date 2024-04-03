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

  @IsString()
  username: string;

  @IsString()
  hashedPassword: string;

  // REMOVED BECAUSE THESE SHOULD BE HANDLED BY THE USER AFTER SIGNUP
  // @IsBoolean()
  // withKey: boolean = false;
  // @IsBoolean()
  // withAccount: boolean = false;

  @IsOptional()
  @IsString()
  encryptionKey: string = null;

  @IsOptional()
  @IsEmail()
  email: string = null;
}
