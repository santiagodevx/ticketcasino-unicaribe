import { Injectable } from '@nestjs/common';
import { TicketStatus, TicketType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resumen general: total tickets por estado y tipo.
   */
  async summary() {
    const [byStatus, byType, totalEmployees] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['type'],
        _count: { _all: true },
        where: { status: TicketStatus.USADO },
      }),
      this.prisma.employee.count({ where: { active: true } }),
    ]);

    return {
      totalActiveEmployees: totalEmployees,
      ticketsByStatus: byStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      consumedByType: byType.map((r) => ({
        type: r.type,
        count: r._count._all,
      })),
    };
  }

  /**
   * Top empleados con más consumos en el periodo actual.
   */
  async topConsumers(limit = 10) {
    const result = await this.prisma.ticket.groupBy({
      by: ['employeeId'],
      where: { status: TicketStatus.USADO },
      _count: { _all: true },
      orderBy: { _count: { employeeId: 'desc' } },
      take: limit,
    });

    const employees = await this.prisma.employee.findMany({
      where: { id: { in: result.map((r) => r.employeeId) } },
      select: { id: true, name: true, document: true },
    });

    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    return result.map((r) => ({
      employee: employeeMap.get(r.employeeId),
      consumed: r._count._all,
    }));
  }

  /**
   * Consumos diarios del último mes, agrupados por tipo.
   */
  async daily() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: TicketStatus.USADO,
        usedAt: { gte: since },
      },
      select: { type: true, usedAt: true },
      orderBy: { usedAt: 'asc' },
    });

    // Agrupa por fecha + tipo en memoria
    const map = new Map<string, { date: string; ALMUERZO: number; MERIENDA: number }>();

    for (const t of tickets) {
      const date = t.usedAt!.toISOString().slice(0, 10);
      if (!map.has(date)) {
        map.set(date, { date, ALMUERZO: 0, MERIENDA: 0 });
      }
      map.get(date)![t.type as TicketType]++;
    }

    return Array.from(map.values());
  }
}

