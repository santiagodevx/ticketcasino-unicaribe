import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TicketType, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { GenerateTicketsDto } from './dto/generate-tickets.dto.js';
import { ValidateTicketDto } from './dto/validate-ticket.dto.js';

const PERIOD_DAYS = 15;
const TICKETS_PER_PERIOD = 15;

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Genera 15 tickets del tipo indicado para un empleado.
   * Cada ticket expira a los 15 días desde la fecha de creación.
   */
  async generate(dto: GenerateTicketsDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId, active: true },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado o inactivo');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + PERIOD_DAYS);

    const data = Array.from({ length: TICKETS_PER_PERIOD }, () => ({
      type: dto.type,
      status: TicketStatus.ACTIVO,
      employeeId: dto.employeeId,
      createdAt: now,
      expiresAt,
    }));

    await this.prisma.ticket.createMany({ data });

    return {
      message: `${TICKETS_PER_PERIOD} tickets de ${dto.type} generados`,
      employeeId: dto.employeeId,
      type: dto.type,
      expiresAt,
    };
  }

  /**
   * Genera tickets de ALMUERZO y MERIENDA para todos los empleados activos de una vez.
   */
  async generateForAll() {
    const employees = await this.prisma.employee.findMany({
      where: { active: true },
      select: { id: true },
    });

    if (employees.length === 0) {
      throw new BadRequestException('No hay empleados activos');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + PERIOD_DAYS);

    const data = employees.flatMap(({ id }) =>
      [TicketType.ALMUERZO, TicketType.MERIENDA].flatMap((type) =>
        Array.from({ length: TICKETS_PER_PERIOD }, () => ({
          type,
          status: TicketStatus.ACTIVO,
          employeeId: id,
          createdAt: now,
          expiresAt,
        })),
      ),
    );

    await this.prisma.ticket.createMany({ data });

    return {
      message: `Tickets generados para ${employees.length} empleados`,
      ticketsCreated: data.length,
      expiresAt,
    };
  }

  /**
   * Valida y marca como USADO un ticket escaneado por QR.
   * Verifica que pertenezca al empleado, esté ACTIVO y no esté vencido.
   */
  async validate(dto: ValidateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.employeeId !== dto.employeeId) {
      throw new BadRequestException('El ticket no pertenece a este empleado');
    }

    if (ticket.status === TicketStatus.USADO) {
      throw new BadRequestException('El ticket ya fue utilizado');
    }

    if (ticket.status === TicketStatus.VENCIDO || ticket.expiresAt < new Date()) {
      throw new BadRequestException('El ticket está vencido');
    }

    const used = await this.prisma.ticket.update({
      where: { id: dto.ticketId },
      data: {
        status: TicketStatus.USADO,
        usedAt: new Date(),
      },
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
   * Historial de consumos de un empleado (tickets USADO).
   */
  async getHistory(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

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
      where: {
        status: TicketStatus.ACTIVO,
        expiresAt: { lt: new Date() },
      },
      data: { status: TicketStatus.VENCIDO },
    });

    return { expired: result.count };
  }
}

