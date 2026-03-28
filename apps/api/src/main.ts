import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParserImport from 'cookie-parser';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { AppModule } from './app.module';

const cookieParser =
  (cookieParserImport as unknown as { default?: unknown }).default ??
  (cookieParserImport as unknown);

async function bootstrap() {
  // Ensure request bodies are parsed (JSON) for normal API routes.
  // We still register a special JSON parser with `verify` for webhooks below.
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  // Allow the Next.js frontend to send cookies (refresh token) to the API.
  // In production, lock this down to your real frontend origin(s).
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // cookie-parser is published as CommonJS; depending on ts-node/tsconfig interop,
  // it can appear as { default: fn } or directly as fn.
  app.use((cookieParser as any)());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('GST Billing SaaS API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // The web app runs on :3000; default the API to :4000 for local dev.
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
