import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export type ErrorFields = Record<string, string[]>;

/** Achata os erros do class-validator em `{ "<campo>": ["mensagem"] }`. */
function toFields(errors: ValidationError[], parent = ''): ErrorFields {
  const fields: ErrorFields = {};
  for (const error of errors) {
    const name = parent ? `${parent}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});
    if (messages.length > 0) {
      fields[name] = messages;
    }
    Object.assign(fields, toFields(error.children ?? [], name));
  }
  return fields;
}

/**
 * ValidationPipe global (architecture §2.1, item 2): converte para o DTO,
 * descarta e recusa campo não declarado, e devolve o erro já no formato do
 * item 5, com o campo que falhou em `fields`.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        message: 'Dados inválidos.',
        fields: toFields(errors),
      }),
  });
}
