import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario del administrador' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Contraseña del administrador' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
