import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmployeesModule,
    TicketsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
