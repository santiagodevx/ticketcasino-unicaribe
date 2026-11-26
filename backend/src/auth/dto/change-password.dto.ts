import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description:
      'Contraseña actual. Obligatoria salvo que el empleado deba cambiarla por primera vez (mustChangePassword = true).',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ description: 'Nueva contraseña', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  newPassword!: string;
}
