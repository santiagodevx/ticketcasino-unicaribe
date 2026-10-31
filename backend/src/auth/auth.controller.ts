import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { EmployeeLoginDto } from './dto/employee-login.dto.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesión como Administrador' })
  @ApiResponse({ status: 200, description: 'Token de acceso JWT para Administrador' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Iniciar sesión como Empleado (App Móvil)' })
  @ApiResponse({ status: 200, description: 'Token JWT y datos del empleado' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o empleado inactivo' })
  @Post('employee-login')
  @HttpCode(HttpStatus.OK)
  employeeLogin(@Body() dto: EmployeeLoginDto) {
    return this.authService.employeeLogin(dto);
  }
}
