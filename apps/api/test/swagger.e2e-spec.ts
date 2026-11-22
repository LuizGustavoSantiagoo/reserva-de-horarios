import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupSwagger } from '../src/common/swagger.js';

interface Operation {
  security?: Record<string, string[]>[];
}

interface OpenApiDocument {
  security?: unknown;
  paths: Record<string, Record<string, Operation>>;
  components?: { securitySchemes?: Record<string, unknown> };
}

// O main.ts monta o Swagger com o mesmo setupSwagger que este teste chama.
describe('/docs-json (e2e)', () => {
  let app: INestApplication<App>;
  let document: OpenApiDocument;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupSwagger(app);
    await app.init();

    // O documento do Swagger é público: abre sem token.
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    document = response.body as OpenApiDocument;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('declara o esquema de segurança Bearer (JWT)', () => {
    expect(document.components?.securitySchemes).toEqual({
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    });
    // Sem segurança global: só as rotas que pedem o Bearer o exigem.
    expect(document.security).toBeUndefined();
  });

  it('GET /users/me exige o Bearer', () => {
    expect(document.paths['/users/me']?.get?.security).toEqual([
      { bearer: [] },
    ]);
  });

  it.each([
    { rota: 'GET /', path: '/', method: 'get' },
    { rota: 'GET /courts', path: '/courts', method: 'get' },
    {
      rota: 'GET /courts/{courtId}/slots',
      path: '/courts/{courtId}/slots',
      method: 'get',
    },
    { rota: 'POST /auth/login', path: '/auth/login', method: 'post' },
  ])('$rota não exige segurança nenhuma', ({ path, method }) => {
    const operation = document.paths[path]?.[method];

    expect(operation).toBeDefined();
    expect(operation?.security).toBeUndefined();
  });
});
