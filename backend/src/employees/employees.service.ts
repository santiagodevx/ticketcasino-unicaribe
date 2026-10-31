import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import * as bcrypt from 'bcryptjs';

const EMPLOYEE_SELECT = {
  id: true,
  document: true,
  name: true,
  username: true,
  active: true,
  createdAt: true,
} as const;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const [existingDoc, existingUser] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { document: dto.document.trim() },
      }),
      this.prisma.employee.findUnique({
        where: { username: dto.username.trim() },
      }),
    ]);

    if (existingDoc) {
      throw new ConflictException('Ya existe un empleado con ese documento');
    }

    if (existingUser) {
      throw new ConflictException('Ese nombre de usuario ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.employee.create({
      data: {
        document: dto.document.trim(),
        name: dto.name.trim(),
        username: dto.username.trim(),
        password: hashedPassword,
      },
      select: EMPLOYEE_SELECT,
    });
  }

  findAll() {
    return this.prisma.employee.findMany({
      select: EMPLOYEE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        ...EMPLOYEE_SELECT,
        tickets: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            expiresAt: true,
            usedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    const data: Record<string, any> = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.active !== undefined) data.active = dto.active;

    if (dto.username !== undefined) {
      const existing = await this.prisma.employee.findUnique({
        where: { username: dto.username.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Ese nombre de usuario ya está en uso');
      }
      data.username = dto.username.trim();
    }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.employee.update({
      where: { id },
      data,
      select: EMPLOYEE_SELECT,
    });
  }

  // Guarda/actualiza la passkey biométrica del empleado
  async savePasskey(id: string, passkey: unknown) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: { passkey: passkey as any },
      select: EMPLOYEE_SELECT,
    });
  }
}
