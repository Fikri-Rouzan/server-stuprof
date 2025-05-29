import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password_plain: string;
}
