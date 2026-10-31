import {
  Injectable,
  UnauthorizedException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { EmployeeLoginDto } from './dto/employee-login.dto.js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureAdminExists();
  }

  private async ensureAdminExists() {
    const adminUsername = process.env.DEFAULT_ADMIN_USER || 'admin';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin_password_123';

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
      },
    };
  }
}
