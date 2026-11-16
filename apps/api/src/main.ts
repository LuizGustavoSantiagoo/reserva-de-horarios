import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Middleware: cabeçalhos de segurança em toda resposta, antes de qualquer rota.
  app.useSecurityHeaders();

  const config = new DocumentBuilder()
    .setTitle('API da Reserva de Horários')
    .setDescription(
      'Todo sucesso responde `{ data }`; todo erro responde ' +
        '`{ statusCode, error, message, fields?, path, timestamp }`.',
    )
    .setVersion('1.0')
    .build();
  // A função adia a montagem do documento para quando alguém abre /docs.
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
