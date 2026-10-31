import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTicketDto {
  @ApiProperty({ example: 'tk_123456789', description: 'ID del ticket que se desea validar/canjear' })
  @IsString()
  ticketId: string;

  @ApiProperty({ example: 'emp_123456789', description: 'ID del empleado dueño del ticket' })
  @IsString()
  employeeId: string;
}
