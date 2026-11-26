import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { EmployeeLoginDto } from './dto/employee-login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureAdminExists();
  }

  private async ensureAdminExists() {
    const adminUsername = this.configService.getOrThrow('DEFAULT_ADMIN_USER');
    const adminPassword = this.configService.getOrThrow(
      'DEFAULT_ADMIN_PASSWORD',
    );

    const adminUser = await this.prisma.user.findUnique({
      where: { username: adminUsername },
    });

    if (!adminUser) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await this.prisma.user.create({
        data: {
          username: adminUsername,
          passwordHash,
        },
      });
      this.logger.log(`✅ Usuario admin inicial creado (${adminUsername})`);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, username: user.username, role: 'ADMIN' };
    const token = this.jwt.sign(payload);

    return { access_token: token, role: 'ADMIN' };
  }

  async employeeLogin(dto: EmployeeLoginDto) {
    const term = dto.username.trim();

    // Permite iniciar sesión con username o documento
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [{ username: term }, { document: term }],
      },
    });

    if (!employee) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!employee.active) {
      throw new UnauthorizedException('El empleado se encuentra inactivo');
    }

    const valid = await bcrypt.compare(dto.password, employee.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: employee.id,
      document: employee.document,
      username: employee.username,
      name: employee.name,
      mustChangePassword: employee.mustChangePassword,
      role: 'EMPLOYEE',
    };
    const token = this.jwt.sign(payload);

    return {
      access_token: token,
      role: 'EMPLOYEE',
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        document: employee.document,
        mustChangePassword: employee.mustChangePassword,
      },
    };
  }

  async changePassword(employeeId: string, dto: ChangePasswordDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee || !employee.active) {
      throw new UnauthorizedException('Empleado no encontrado o inactivo');
    }

    // Primer ingreso (mustChangePassword = true): la sesión recién iniciada
    // con la contraseña temporal ya es la prueba, no se pide la actual.
    // En cualquier otro caso se exige y se verifica.
    if (!employee.mustChangePassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Debes ingresar tu contraseña actual');
      }
      const validCurrent = await bcrypt.compare(
        dto.currentPassword,
        employee.password,
      );
      if (!validCurrent) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }
    }

    const isSame = await bcrypt.compare(dto.newPassword, employee.password);
    if (isSame) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    const updated = await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
        mustChangePassword: false,
      },
    });

    // Se emite un token nuevo porque el anterior lleva mustChangePassword: true
    const payload = {
      sub: updated.id,
      document: updated.document,
      username: updated.username,
      name: updated.name,
      mustChangePassword: updated.mustChangePassword,
      role: 'EMPLOYEE',
    };
    const token = this.jwt.sign(payload);

    return {
      access_token: token,
      role: 'EMPLOYEE',
      employee: {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        document: updated.document,
        mustChangePassword: updated.mustChangePassword,
      },
    };
  }
}
