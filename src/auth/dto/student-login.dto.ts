import { IsString, IsNotEmpty } from 'class-validator';

export class StudentLoginDto {
  @IsString()
  @IsNotEmpty()
  nim: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
