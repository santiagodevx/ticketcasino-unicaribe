import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('Analítica y Reportes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Resumen general de empleados y tickets por estado' })
  @ApiResponse({ status: 200, description: 'Estadísticas globales del sistema' })
  @Get('summary')
  summary() {
    return this.analyticsService.summary();
  }

  @ApiOperation({ summary: 'Ranking de empleados con mayor consumo de tickets' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Cantidad máxima de resultados' })
  @ApiResponse({ status: 200, description: 'Lista ordenada de consumidores top' })
  @Get('top-consumers')
  topConsumers(@Query('limit') limit?: string) {
    return this.analyticsService.topConsumers(limit ? parseInt(limit) : 10);
  }

  @ApiOperation({ summary: 'Consumos diarios de tickets en los últimos 30 días' })
  @ApiResponse({ status: 200, description: 'Agrupación de consumos por fecha y tipo' })
  @Get('daily')
  daily() {
    return this.analyticsService.daily();
  }
}
