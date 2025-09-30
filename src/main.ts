import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS Starter Template API')
    .setDescription(
      `
      A complete NestJS starter template with:
      - JWT Authentication with access & refresh tokens
      - Role-based access control (USER, ADMIN, MODERATOR)
      - PostgreSQL database with Prisma ORM
      - AWS S3 integration for file operations
      - WebSocket implementation with Socket.IO
      - Stripe payment processing with subscriptions
      - Comprehensive validation and error handling
    `,
    )
    .setVersion('1.0.0')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('S3', 'AWS S3 file operations endpoints')
    .addTag('WebSocket', 'Real-time WebSocket communication endpoints')
    .addTag('Stripe', 'Payment processing and subscription management endpoints')
    .addBearerAuth(
      {
        description: 'JWT Authorization header using the Bearer scheme',
        name: 'Authorization',
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger documentation is available at: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
void bootstrap();
