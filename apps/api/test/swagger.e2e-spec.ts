import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupSwagger } from '../src/common/swagger.js';

interface Operation {
  security?: Record<string, string[]>[];
  responses?: Record<string, unknown>;
}

interface OpenApiDocument {
  security?: unknown;
  paths: Record<string, Record<string, Operation>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, { properties?: Record<string, unknown> }>;
  };
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

  it('POST /users exige o Bearer e documenta 201, 400, 401, 403 e 409', () => {
    const operation = document.paths['/users']?.post;

    expect(operation?.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(operation?.responses ?? {})).toEqual(
      expect.arrayContaining(['201', '400', '401', '403', '409']),
    );
  });

  it('GET /users exige o Bearer e documenta 200, 401 e 403', () => {
    const operation = document.paths['/users']?.get;

    expect(operation?.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(operation?.responses ?? {})).toEqual(
      expect.arrayContaining(['200', '401', '403']),
    );
  });

  it('GET /users/{id} exige o Bearer e documenta 200, 400, 401, 403 e 404', () => {
    const operation = document.paths['/users/{id}']?.get;

    expect(operation?.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(operation?.responses ?? {})).toEqual(
      expect.arrayContaining(['200', '400', '401', '403', '404']),
    );
  });

  it('GET /arena exige o Bearer e documenta 200, 401 e 404', () => {
    const operation = document.paths['/arena']?.get;

    expect(operation?.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(operation?.responses ?? {})).toEqual(
      expect.arrayContaining(['200', '401', '404']),
    );
    expect(JSON.stringify(operation?.responses?.['200'])).toContain(
      '#/components/schemas/ArenaDto',
    );
    expect(
      Object.keys(document.components?.schemas?.ArenaDto?.properties ?? {}),
    ).toEqual(['id', 'name', 'address', 'courts']);
    expect(
      Object.keys(
        document.components?.schemas?.ArenaCourtDto?.properties ?? {},
      ),
    ).toEqual(['id', 'name', 'isActive']);
  });

  it('POST /courts exige o Bearer, documenta 201, 400, 401, 403 e 409 e os DTOs de entrada e saída', () => {
    const operation = document.paths['/courts']?.post as Operation & {
      requestBody?: unknown;
    };

    expect(operation?.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(operation?.responses ?? {})).toEqual(
      expect.arrayContaining(['201', '400', '401', '403', '409']),
    );
    expect(JSON.stringify(operation?.requestBody)).toContain(
      '#/components/schemas/CourtNameDto',
    );
    expect(JSON.stringify(operation?.responses?.['201'])).toContain(
      '#/components/schemas/CreatedCourtDto',
    );
    expect(
      Object.keys(document.components?.schemas?.CourtNameDto?.properties ?? {}),
    ).toEqual(['name']);
    expect(
      Object.keys(
        document.components?.schemas?.CreatedCourtDto?.properties ?? {},
      ).sort(),
    ).toEqual(['arenaId', 'id', 'isActive', 'name']);
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
