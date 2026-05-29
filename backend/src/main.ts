import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { globalValidationPipe } from './common/pipes/validation.pipe';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  const bodyLimit = config.get<string>('http.bodyLimit', '1mb');
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  app.use(
    helmet({
      contentSecurityPolicy: config.get<string>('nodeEnv') === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  const corsOrigin = config.get<string>('corsOrigin', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portal RH API')
    .setDescription('Corporate HR self-service platform — REST API V1')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'tenant')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port', 3001);
  try {
    await app.listen(port);
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
    if (code === 'EADDRINUSE') {
      console.error(`\nPort ${port} is already in use (another API instance is running).`);
      console.error(`  Stop it:  npm run api:stop`);
      console.error(`  Or change PORT in backend/.env\n`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`Portal RH API running on http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
