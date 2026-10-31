import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Juan Carlos Pérez', description: 'Nombre completo' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'jperez', description: 'Nombre de usuario' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'nuevaClave123', description: 'Nueva contraseña opcional' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: true, description: 'Estado activo o inactivo' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
