import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { EmployeeLoginDto } from './dto/employee-login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
// TODO: ajusta la ruta a tu guard JWT real
import { JwtAuthGuard } from './jwt-auth.guard.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesión como Administrador' })
  @ApiResponse({
    status: 200,
    description: 'Token de acceso JWT para Administrador',
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Iniciar sesión como Empleado (App Móvil)' })
  @ApiResponse({ status: 200, description: 'Token JWT y datos del empleado' })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o empleado inactivo',
  })
  @Post('employee-login')
  @HttpCode(HttpStatus.OK)
  employeeLogin(@Body() dto: EmployeeLoginDto) {
    return this.authService.employeeLogin(dto);
  }

  @ApiOperation({ summary: 'Cambiar la contraseña del empleado autenticado' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada. Devuelve un token nuevo',
  })
  @ApiResponse({
    status: 400,
    description: 'Contraseña actual incorrecta o nueva contraseña inválida',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo disponible para empleados' })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    // Ajusta según lo que devuelva tu JwtStrategy.validate():
    // si devuelve el payload completo usa req.user.sub; si lo mapea, req.user.id
    const { role, sub, id } = req.user;
    if (role !== 'EMPLOYEE') {
      throw new ForbiddenException(
        'Solo los empleados pueden usar este endpoint',
      );
    }
    return this.authService.changePassword(sub ?? id, dto);
  }
}
