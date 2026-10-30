import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';

const EMPLOYEE_SELECT = {
  id: true,
  document: true,
  name: true,
  active: true,
  createdAt: true,
} as const;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const exists = await this.prisma.employee.findUnique({
      where: { document: dto.document },
    });

    if (exists) {
      throw new ConflictException('Ya existe un empleado con ese documento');
    }

    return this.prisma.employee.create({
      data: dto,
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

    return this.prisma.employee.update({
      where: { id },
      data: dto,
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

