import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TicketType, TicketStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { GenerateTicketsDto } from './dto/generate-tickets.dto.js';
import { ValidateTicketDto } from './dto/validate-ticket.dto.js';

const PERIOD_DAYS = 15;
const TICKETS_PER_PERIOD = 15;

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna cuántos tickets vigentes tiene un empleado por tipo en el periodo actual.
   */
  private async countCurrentPeriodTickets(employeeId: string, type: TicketType): Promise<number> {
    return this.prisma.ticket.count({
      where: {
        employeeId,
        type,
        expiresAt: { gt: new Date() },
        status: { not: TicketStatus.VENCIDO },
      },
    });
  }

  /**
   * Genera tickets del tipo indicado para un empleado, respetando el límite por periodo.
   * Idempotente: si ya tiene 15, no crea ninguno.
   */
  async generate(dto: GenerateTicketsDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId, active: true },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado o inactivo');
    }

    const existing = await this.countCurrentPeriodTickets(dto.employeeId, dto.type);
    const toCreate = TICKETS_PER_PERIOD - existing;

    if (toCreate <= 0) {
      return {
        message: `El empleado ya tiene ${existing} tickets de ${dto.type} en el periodo vigente`,
        employeeId: dto.employeeId,
        type: dto.type,
        created: 0,
      };
    }

    const now = dayjs();
    const expiresAt = now.add(PERIOD_DAYS, 'day').toDate();

    const data = Array.from({ length: toCreate }, () => ({
      type: dto.type,
      status: TicketStatus.ACTIVO,
      employeeId: dto.employeeId,
      createdAt: now.toDate(),
      expiresAt,
    }));

    await this.prisma.ticket.createMany({ data });

    return {
      message: `${toCreate} tickets de ${dto.type} generados`,
      employeeId: dto.employeeId,
      type: dto.type,
      created: toCreate,
      expiresAt,
    };
  }

  /**
   * Genera tickets de ALMUERZO y MERIENDA para todos los empleados activos.
   * Idempotente: por cada empleado y tipo solo crea los tickets que falten hasta llegar a 15.
   */
  async generateForAll() {
    const employees = await this.prisma.employee.findMany({
      where: { active: true },
      select: { id: true },
    });

    if (employees.length === 0) {
      throw new BadRequestException('No hay empleados activos');
    }

    const now = dayjs();
    const expiresAt = now.add(PERIOD_DAYS, 'day').toDate();
    const types = [TicketType.ALMUERZO, TicketType.MERIENDA];

    // Cuenta los tickets vigentes de cada empleado+tipo en paralelo
    const counts = await Promise.all(
      employees.flatMap(({ id }) =>
        types.map(async (type) => ({
          employeeId: id,
          type,
          existing: await this.countCurrentPeriodTickets(id, type),
        })),
      ),
    );

    const data = counts.flatMap(({ employeeId, type, existing }) => {
      const toCreate = TICKETS_PER_PERIOD - existing;
      if (toCreate <= 0) return [];
      return Array.from({ length: toCreate }, () => ({
        type,
        status: TicketStatus.ACTIVO,
        employeeId,
        createdAt: now.toDate(),
        expiresAt,
      }));
    });

    if (data.length > 0) {
      await this.prisma.ticket.createMany({ data });
    }

    return {
      message: `Periodo generado para ${employees.length} empleados`,
      ticketsCreated: data.length,
      expiresAt,
    };
  }

  /**
   * Valida y marca como USADO un ticket escaneado por QR.
   * Verifica que pertenezca al empleado, esté ACTIVO, no esté vencido,
   * y que no haya usado ya un ticket del mismo tipo hoy.
   */
  async validate(dto: ValidateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (ticket.employeeId !== dto.employeeId) throw new BadRequestException('El ticket no pertenece a este empleado');
    if (ticket.status === TicketStatus.USADO) throw new BadRequestException('El ticket ya fue utilizado');
    if (ticket.status === TicketStatus.VENCIDO || ticket.expiresAt < new Date()) throw new BadRequestException('El ticket está vencido');

    // ── Restricción: máximo 1 ticket por tipo por día ──
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const alreadyUsedToday = await this.prisma.ticket.count({
      where: {
        employeeId: dto.employeeId,
        type: ticket.type,
        status: TicketStatus.USADO,
        usedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    if (alreadyUsedToday > 0) {
      const typeLabel = ticket.type === 'ALMUERZO' ? 'almuerzo' : 'merienda';
      throw new BadRequestException(`Este empleado ya utilizó su ticket de ${typeLabel} hoy`);
    }

    const used = await this.prisma.ticket.update({
      where: { id: dto.ticketId },
      data: { status: TicketStatus.USADO, usedAt: new Date() },
      select: {
        id: true,
        type: true,
        status: true,
        usedAt: true,
        employee: { select: { id: true, name: true, document: true } },
      },
    });

    return { ok: true, ticket: used };
  }

  /**
   * Resumen del empleado autenticado: tickets activos por tipo + historial reciente.
   * Usado por el portal móvil.
   */
  async getMySummary(employeeId: string) {
    const now = new Date();
    const [almuerzosActivos, meriendасActivas, historialReciente] = await Promise.all([
      this.prisma.ticket.count({
        where: { employeeId, type: TicketType.ALMUERZO, status: TicketStatus.ACTIVO, expiresAt: { gt: now } },
      }),
      this.prisma.ticket.count({
        where: { employeeId, type: TicketType.MERIENDA, status: TicketStatus.ACTIVO, expiresAt: { gt: now } },
      }),
      this.prisma.ticket.findMany({
        where: { employeeId, status: TicketStatus.USADO },
        select: { id: true, type: true, usedAt: true },
        orderBy: { usedAt: 'desc' },
        take: 10,
      }),
    ]);

    return { almuerzosActivos, meriendасActivas, historialReciente };
  }

  /**
   * Historial de consumos de un empleado (tickets USADO).
   */
  async getHistory(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');

    return this.prisma.ticket.findMany({
      where: { employeeId, status: TicketStatus.USADO },
      select: { id: true, type: true, usedAt: true, createdAt: true },
      orderBy: { usedAt: 'desc' },
    });
  }

  /**
   * Tickets activos de un empleado.
   */
  async getActive(employeeId: string) {
    return this.prisma.ticket.findMany({
      where: {
        employeeId,
        status: TicketStatus.ACTIVO,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, type: true, expiresAt: true, createdAt: true },
      orderBy: { expiresAt: 'asc' },
    });
  }

  /**
   * Marca como VENCIDO todos los tickets expirados (cron / scheduled task).
   */
  async expireStale() {
    const result = await this.prisma.ticket.updateMany({
      where: { status: TicketStatus.ACTIVO, expiresAt: { lt: new Date() } },
      data: { status: TicketStatus.VENCIDO },
    });

    return { expired: result.count };
  }

  /**
   * Cron: genera 15 tickets de ALMUERZO y 15 de MERIENDA
   * para todos los empleados activos cada 15 días.
   * Se ejecuta a las 6:00 AM los días 1 y 16 de cada mes.
   */
  @Cron('0 6 1,16 * *')
  async scheduledGenerateForAll() {
    this.logger.log('⏰ Cron: Generando tickets del periodo de 15 días...');
    const result = await this.generateForAll();
    this.logger.log(`✅ Cron finalizado: ${result.ticketsCreated} tickets creados`);
  }

  /**
   * Cron: vence tickets expirados todos los días a medianoche.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledExpireStale() {
    const result = await this.expireStale();
    if (result.expired > 0) {
      this.logger.log(`⏰ Cron: ${result.expired} tickets marcados como VENCIDO`);
    }
  }
}
