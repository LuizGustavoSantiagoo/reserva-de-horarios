import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Monta o Swagger UI em `/docs` e o documento em `/docs-json`. Fica fora do main.ts
 * para os testes de ponta a ponta, que montam o AppModule sem ele, chamarem a mesma
 * configuração.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API da Reserva de Horários')
    .setDescription(
      'Todo sucesso responde `{ data }`; todo erro responde ' +
        '`{ statusCode, error, message, fields?, path, timestamp }`.',
    )
    .setVersion('1.0')
    // Esquema "bearer": as rotas protegidas o pedem com @ApiBearerAuth(), e o botão
    // Authorize da UI passa o token a elas. As públicas não declaram segurança.
    .addBearerAuth()
    .build();
  // A função adia a montagem do documento para quando alguém abre /docs.
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
