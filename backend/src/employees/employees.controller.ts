import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';

@ApiTags('Empleados')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiOperation({ summary: 'Registrar un nuevo empleado' })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Documento o usuario ya en uso' })
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @ApiOperation({ summary: 'Listar todos los empleados' })
  @ApiResponse({ status: 200, description: 'Lista de empleados' })
  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @ApiOperation({ summary: 'Obtener información y tickets de un empleado por ID' })
  @ApiResponse({ status: 200, description: 'Detalle del empleado' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar datos de un empleado' })
  @ApiResponse({ status: 200, description: 'Empleado actualizado' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Registrar credencial/passkey para biometría' })
  @Post(':id/passkey')
  savePasskey(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.employeesService.savePasskey(id, body);
  }
}
