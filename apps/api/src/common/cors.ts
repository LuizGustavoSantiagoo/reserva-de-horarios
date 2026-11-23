import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation.js';

/**
 * Libera para o navegador só a origem do frontend, lida de `CORS_ORIGIN` pelo
 * ConfigModule. Fica fora do main.ts para os testes de ponta a ponta, que montam o
 * AppModule sem ele, chamarem a mesma configuração.
 */
export function enableCors(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  // Em lista, e não como texto solto: assim outra origem não recebe cabeçalho nenhum.
  app.enableCors({ origin: [config.get('CORS_ORIGIN', { infer: true })] });
}
