import { NestFactory, Reflector } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

function formatValidationErrors(errors: ValidationError[]): { property: string; message: string }[] {
  const result: { property: string; message: string }[] = [];
  for (const err of errors) {
    if (err.constraints) {
      result.push({
        property: err.property,
        message: String(Object.values(err.constraints)[0]),
      });
    }
    if (err.children && err.children.length > 0) {
      result.push(...formatValidationErrors(err.children));
    }
  }
  return result;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException(formatValidationErrors(errors));
      },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformResponseInterceptor(reflector));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
