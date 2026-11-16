import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor.js';

describe('TransformInterceptor', () => {
  const context = {} as ExecutionContext;

  it('embrulha a resposta de sucesso em { data }', async () => {
    const next: CallHandler = { handle: () => of({ id: 1, name: 'Quadra 1' }) };

    const result = await firstValueFrom(
      new TransformInterceptor().intercept(context, next),
    );

    expect(result).toEqual({ data: { id: 1, name: 'Quadra 1' } });
  });

  it('embrulha também texto e lista, sem alterar o conteúdo', async () => {
    const interceptor = new TransformInterceptor();

    await expect(
      firstValueFrom(
        interceptor.intercept(context, { handle: () => of('ok') }),
      ),
    ).resolves.toEqual({ data: 'ok' });
    await expect(
      firstValueFrom(interceptor.intercept(context, { handle: () => of([]) })),
    ).resolves.toEqual({ data: [] });
  });
});
