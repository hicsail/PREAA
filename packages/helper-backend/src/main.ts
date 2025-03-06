import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Apply validation pipe globally 
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );


  await app.listen(process.env.PORT ?? 3001);

}
bootstrap();
