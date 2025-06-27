import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    exposedHeaders: ['Content-Range']
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('LiteLLM-Langflow Proxy API')
    .setDescription('API documentation for managing mappings and proxies between Langflow and LiteLLM.')
    .setVersion('1.0')
    .addTag('Deepchat Proxy', 'Endpoints for managing LLM provider proxies')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: []
  });

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      persistAuthorization: true
    }
  });

  // Apply validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
