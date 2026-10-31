import { IsNotEmpty, IsString } from 'class-validator';

export class EmployeeLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

