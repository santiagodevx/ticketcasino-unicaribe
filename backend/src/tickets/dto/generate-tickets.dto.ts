import { TicketType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class GenerateTicketsDto {
  @IsString()
  employeeId: string;

  @IsEnum(TicketType)
  type: TicketType;
}

