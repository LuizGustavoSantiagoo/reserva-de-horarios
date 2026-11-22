import { BadRequestException } from '@nestjs/common';
import { IsInt, IsString } from 'class-validator';
import { createValidationPipe } from './validation.pipe.js';

class SampleDto {
  @IsString()
  name!: string;

  @IsInt()
  quantity!: number;
}

describe('createValidationPipe', () => {
  const metadata = { type: 'body', metatype: SampleDto } as const;

  it('aceita o corpo válido', async () => {
    await expect(
      createValidationPipe().transform({ name: 'a', quantity: 2 }, metadata),
    ).resolves.toEqual({ name: 'a', quantity: 2 });
  });

  it('recusa com 400 e aponta cada campo que falhou em `fields`', async () => {
    const error = await createValidationPipe()
      .transform({ name: 1, quantity: 'x' }, metadata)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    const response = (error as BadRequestException).getResponse() as {
      message: string;
      fields: Record<string, string[]>;
    };
    expect(response.message).toBe('Dados inválidos.');
    expect(Object.keys(response.fields).sort()).toEqual(['name', 'quantity']);
    expect(response.fields.name[0]).toEqual(expect.any(String));
  });

  it('recusa campo que o DTO não declara', async () => {
    const error = await createValidationPipe()
      .transform({ name: 'a', quantity: 2, admin: true }, metadata)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(
      ((error as BadRequestException).getResponse() as { fields: object })
        .fields,
    ).toHaveProperty('admin');
  });
});
