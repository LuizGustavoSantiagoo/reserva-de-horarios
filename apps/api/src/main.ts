import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { enableCors } from './common/cors.js';
import { setupSwagger } from './common/swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Middleware: cabeçalhos de segurança em toda resposta, antes de qualquer rota.
  app.useSecurityHeaders();
  // O frontend chama a API de outra origem (VITE_API_URL): sem isto, o navegador barra a resposta.
  enableCors(app);

  // Swagger UI em /docs (com o botão Authorize do Bearer) e o documento em /docs-json.
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
