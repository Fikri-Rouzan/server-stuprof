import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(16)
  nim: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password_plain: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  hobby?: string;
}
