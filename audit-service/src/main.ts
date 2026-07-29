import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const origins = (config.get<string>('CORS_ORIGINS') ?? '*').split(',').map((item) => item.trim());
  app.enableCors({ origin: origins.includes('*') ? true : origins });
  await app.listen(Number(config.get<string>('PORT') ?? 3002), '0.0.0.0');
}

void bootstrap();
