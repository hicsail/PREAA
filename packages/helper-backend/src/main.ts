import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
    // Configure Swagger
    const config = new DocumentBuilder()
    .setTitle('LiteLLM-Langflow Proxy API')
    .setDescription('API documentation for managing mappings and proxies between Langflow and LiteLLM.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // Apply validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );


  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
