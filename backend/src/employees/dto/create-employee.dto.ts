import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6,15}$/, { message: 'El documento debe tener entre 6 y 15 dígitos' })
  document: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

