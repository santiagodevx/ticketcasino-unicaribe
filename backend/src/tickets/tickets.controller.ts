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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TicketsService } from './tickets.service.js';
import { GenerateTicketsDto } from './dto/generate-tickets.dto.js';
import { ValidateTicketDto } from './dto/validate-ticket.dto.js';

@ApiTags('Tiquetes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiOperation({ summary: 'Generar tickets para un empleado específico' })
  @ApiResponse({ status: 201, description: 'Tickets generados' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @Post('generate')
  generate(@Body() dto: GenerateTicketsDto) {
    return this.ticketsService.generate(dto);
  }

  @ApiOperation({ summary: 'Generar tickets masivos de periodo para todos los empleados activos' })
  @ApiResponse({ status: 201, description: 'Resumen de tickets creados' })
  @Post('generate-all')
  generateForAll() {
    return this.ticketsService.generateForAll();
  }

  @ApiOperation({ summary: 'Validar y canjear un tiquete mediante código QR (Lector Casino)' })
  @ApiResponse({ status: 200, description: 'Tiquete validado y marcado como USADO' })
  @ApiResponse({ status: 400, description: 'Tiquete no corresponde, vencido o límite diario superado' })
  @ApiResponse({ status: 404, description: 'Tiquete no encontrado' })
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateTicketDto) {
    return this.ticketsService.validate(dto);
  }

  @ApiOperation({ summary: 'Canjear un tiquete (Alias de validación)' })
  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  redeem(@Body() dto: ValidateTicketDto) {
    return this.ticketsService.validate(dto);
  }

  @ApiOperation({ summary: 'Vencer tiquetes cuya fecha de expiración haya pasado' })
  @Post('expire')
  @HttpCode(HttpStatus.OK)
  expire() {
    return this.ticketsService.expireStale();
  }

  @ApiOperation({ summary: 'Consultar resumen de tickets del empleado en sesión (App Móvil)' })
  @ApiResponse({ status: 200, description: 'Contadores de tickets activos e historial' })
  @Get('my-summary')
  getMySummary(@Req() req: Request) {
    const employeeId = (req.user as any).userId;
    return this.ticketsService.getMySummary(employeeId);
  }

  @ApiOperation({ summary: 'Historial de consumos de un empleado' })
  @Get('employee/:id/history')
  getHistory(@Param('id') id: string) {
    return this.ticketsService.getHistory(id);
  }

  @ApiOperation({ summary: 'Tickets activos disponibles de un empleado' })
  @Get('employee/:id/active')
  getActive(@Param('id') id: string) {
    return this.ticketsService.getActive(id);
  }
}
