import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import envConfig from '../env.config';

function initSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Lightway API')
    .setDescription('The API endpoints and descriptions of Lightway API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}

function initValidationPipe(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  initValidationPipe(app);

  app.enableCors();
  initSwagger(app);

  await app.listen(envConfig.PORT);
}

void bootstrap();
