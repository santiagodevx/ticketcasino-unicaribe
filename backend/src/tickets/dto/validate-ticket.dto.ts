import { IsString } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  ticketId: string;

  @IsString()
  employeeId: string;
}

