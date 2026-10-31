import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora campos no declarados en el DTO
      forbidNonWhitelisted: true,
      transform: true, // Convierte tipos automáticamente
    }),
  );

  // CORS para el frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  // Prefijo global de API — todas las rutas quedan en /api/*
  app.setGlobalPrefix('api');

  // ── OpenAPI / Swagger ──────────────────────────────────────────────────────
  // SwaggerModule.setup NO aplica el globalPrefix automáticamente,
  // por eso ponemos la ruta completa 'api/api-docs' de forma explícita.
  // Resultado final: http://host/api/api-docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TicketCasino API')
    .setDescription(
      'Documentación interactiva de los endpoints de TicketCasino — ' +
      'Sistema Digital de Gestión y Validación de Tiquetes de Alimentación.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa el token JWT obtenido tras iniciar sesión en /api/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene el token entre recargas
    },
  });
  // ─────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en http://localhost:${port}/api`);
  console.log(`📚 Swagger UI disponible en http://localhost:${port}/api/api-docs`);
}

await bootstrap();
