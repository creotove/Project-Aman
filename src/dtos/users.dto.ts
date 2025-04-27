import { UserRole } from '@/enums';
import { IsPhoneAlreadyExist } from '@/validators/is-phone-exist.validator';
import { IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Please provide a valid phone number' })
  @IsPhoneAlreadyExist({ message: 'Phone number already exists.' })
  public phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  public password: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: `Invalid account type, it can be ${Object.keys(UserRole).join(', ')}. ` })
  public role: UserRole;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  public name: string;

  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Please provide a valid phone number' })
  public phone: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(32)
  public password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: `Invalid account type, it can be ${Object.keys(UserRole).join(', ')}. ` })
  public role: UserRole;
}

export class LoginUserDto {
  @IsPhoneNumber()
  @IsNotEmpty({ message: 'Please provide a valid phone number' })
  public phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  public password: string;
}
