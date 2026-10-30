import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AnalyticsService } from './analytics.service.js';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // GET /analytics/summary — resumen general
  @Get('summary')
  summary() {
    return this.analyticsService.summary();
  }

  // GET /analytics/top-consumers?limit=10 — top empleados por consumo
  @Get('top-consumers')
  topConsumers(@Query('limit') limit?: string) {
    return this.analyticsService.topConsumers(limit ? parseInt(limit) : 10);
  }

  // GET /analytics/daily — consumos diarios últimos 30 días
  @Get('daily')
  daily() {
    return this.analyticsService.daily();
  }
}

