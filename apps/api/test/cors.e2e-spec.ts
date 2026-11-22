import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { enableCors } from '../src/common/cors.js';

// O navegador só entrega a resposta à tela se ela trouxer o Access-Control-Allow-Origin
// da origem do frontend. O main.ts chama o mesmo enableCors que este teste chama.
describe('CORS (e2e)', () => {
  let app: INestApplication<App>;
  let allowedOrigin: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    enableCors(app);
    await app.init();
    allowedOrigin = app.get(ConfigService).getOrThrow<string>('CORS_ORIGIN');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('libera a origem de CORS_ORIGIN na resposta', async () => {
    const response = await request(app.getHttpServer())
      .get('/courts')
      .set('Origin', allowedOrigin)
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
  });

  it('responde o preflight da origem de CORS_ORIGIN', async () => {
    const response = await request(app.getHttpServer())
      .options('/courts')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
  });

  // O Authorization: Bearer do painel não é um cabeçalho "simples": o navegador
  // pergunta antes (preflight), e o preflight não leva token — o guard não pode barrá-lo.
  it('libera o preflight que pede o cabeçalho authorization, numa rota protegida', async () => {
    const response = await request(app.getHttpServer())
      .options('/users/me')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(
      String(response.headers['access-control-allow-headers'])
        .toLowerCase()
        .split(',')
        .map((header) => header.trim()),
    ).toContain('authorization');
  });

  it('não libera outra origem', async () => {
    const response = await request(app.getHttpServer())
      .get('/courts')
      .set('Origin', 'http://outra-origem.example')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
