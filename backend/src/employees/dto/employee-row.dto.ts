import { Exclude, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class EmployeeRowDto {
  @IsString()
  @IsNotEmpty()
  document: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Exclude() // Excluido provisionalmente
  @IsString()
  username: string;

  @Exclude() // Excluido provisionalmente
  @IsString()
  @Length(6, 100)
  password: string;

  /** "true" / "false" -> boolean. Vacío = true. Otro valor falla en @IsBoolean. */
  @Transform(({ value }) => {
    if (value === undefined || value === '') return true;
    const v = String(value).toLowerCase();
    return v === 'true' ? true : v === 'false' ? false : value;
  })
  @IsBoolean()
  active: boolean;
}
