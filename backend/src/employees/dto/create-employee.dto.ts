import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: '1045678901', description: 'Número de documento / cédula (6 a 15 dígitos)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6,15}$/, { message: 'El documento debe tener entre 6 y 15 dígitos' })
  document: string;

  @ApiProperty({ example: 'Juan Carlos Pérez', description: 'Nombre completo del empleado' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jperez', description: 'Usuario asignado para el portal móvil' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña para acceder a la app' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
