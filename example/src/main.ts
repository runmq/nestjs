import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3012);
  console.log('App running on http://localhost:3012');
  console.log('POST /orders  { "item": "Laptop", "quantity": 1 }');
}

bootstrap();
