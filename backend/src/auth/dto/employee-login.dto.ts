import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmployeeLoginDto {
  @ApiProperty({ example: 'jperez', description: 'Nombre de usuario o documento del empleado' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '123456', description: 'Contraseña del empleado' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
