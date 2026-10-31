import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TicketsService } from './tickets.service.js';
import { GenerateTicketsDto } from './dto/generate-tickets.dto.js';
import { ValidateTicketDto } from './dto/validate-ticket.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // POST /tickets/generate — genera 15 tickets a un empleado
  @Post('generate')
  generate(@Body() dto: GenerateTicketsDto) {
    return this.ticketsService.generate(dto);
  }

  // POST /tickets/generate-all — genera tickets a todos los empleados activos
  @Post('generate-all')
  generateForAll() {
    return this.ticketsService.generateForAll();
  }

  // POST /tickets/validate — valida QR (marca como USADO)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateTicketDto) {
    return this.ticketsService.validate(dto);
  }

  // POST /tickets/redeem — alias de validate, para uso desde el portal del empleado
  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  redeem(@Body() dto: ValidateTicketDto) {
    return this.ticketsService.validate(dto);
  }

  // POST /tickets/expire — vence tickets expirados manualmente
  @Post('expire')
  @HttpCode(HttpStatus.OK)
  expire() {
    return this.ticketsService.expireStale();
  }

  // GET /tickets/my-summary — resumen del empleado autenticado (para el portal móvil)
  @Get('my-summary')
  getMySummary(@Req() req: Request) {
    const employeeId = (req.user as any).userId;
    return this.ticketsService.getMySummary(employeeId);
  }

  // GET /tickets/employee/:id/history — historial de consumos
  @Get('employee/:id/history')
  getHistory(@Param('id') id: string) {
    return this.ticketsService.getHistory(id);
  }

  // GET /tickets/employee/:id/active — tickets activos
  @Get('employee/:id/active')
  getActive(@Param('id') id: string) {
    return this.ticketsService.getActive(id);
  }
}

