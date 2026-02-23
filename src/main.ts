import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // ============================================
  // SWAGGER CONFIGURATION
  // ============================================
  const config = new DocumentBuilder()
    .setTitle('Daily Thoughts API')
    .setDescription('Complete API documentation for Daily Thoughts application')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Posts', 'Daily thoughts posts endpoints')
    .addTag('Social Graph', 'Follow/Unfollow functionality')

    // Add Bearer Auth
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for later reference
    )

    // Add API Key Auth (optional, for CSRF)
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-CSRF-Token',
        in: 'header',
        description: 'CSRF protection token',
      },
      'CSRF-token',
    )

    // Contact and license info
    .setContact(
      'Daily Thoughts Team',
      'https://dailythoughts.com',
      'durgeshchaudhari199@gmail.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')

    // Servers
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api.dailythoughts.com', 'Production')

    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI at /api path
  SwaggerModule.setup('api', app, document, {
  //   customSiteTitle: 'Daily Thoughts API Docs',
  //   customfavIcon: 'https://your-favicon-url.com/favicon.ico',
  //   customCss: `
  //     .swagger-ui .topbar { background-color: #2c3e50; }
  //     .swagger-ui .topbar-wrapper img { content: url(''); }
  //   `,
  //   swaggerOptions: {
  //     persistAuthorization: true, // Keep auth token after refresh
  //     filter: true, // Enable search/filter
  //     displayRequestDuration: true, // Show request duration
  //   },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('🚀 Server running on http://localhost:' + port);
  console.log('📚 Swagger Docs: http://localhost:' + port + '/api');
  console.log('⚡ Using Drizzle ORM + Neon Database');
}
bootstrap();
