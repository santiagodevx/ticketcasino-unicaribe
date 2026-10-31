import { TicketType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTicketsDto {
  @ApiProperty({ example: 'clx123abc456', description: 'ID único del empleado' })
  @IsString()
  employeeId: string;

  @ApiProperty({ enum: TicketType, example: TicketType.ALMUERZO, description: 'Tipo de tiquete a generar' })
  @IsEnum(TicketType)
  type: TicketType;
}
