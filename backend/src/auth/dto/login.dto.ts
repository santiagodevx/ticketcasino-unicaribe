import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario del administrador' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Contraseña del administrador', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
