import {
  Injectable,
  UnauthorizedException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
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

    const payload = { sub: user.id, username: user.username };
    const token = this.jwt.sign(payload);

    return { access_token: token };
  }
}

