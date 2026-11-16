import { STATUS_CODES } from 'node:http';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ErrorFields } from './validation.pipe.js';

/** Formato único de erro da API (architecture §2.1, item 5). */
export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  fields?: ErrorFields;
  path: string;
  timestamp: string;
}

interface HttpRequestLike {
  method: string;
  url: string;
}

interface HttpResponseLike {
  status(code: number): { json(body: ErrorBody): unknown };
}

interface PrismaKnownError {
  code: string;
  meta?: Record<string, unknown>;
}

interface Translated {
  statusCode: number;
  message: string;
  fields?: ErrorFields;
}

const GENERIC_MESSAGE = 'Erro interno.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Reconhece o erro conhecido do Prisma pelo nome e pelo código, sem importar o
 * client gerado: o filtro vale para a API inteira, com ou sem models.
 */
function isPrismaKnownError(exception: unknown): exception is PrismaKnownError {
  return (
    isRecord(exception) &&
    exception.name === 'PrismaClientKnownRequestError' &&
    typeof exception.code === 'string'
  );
}

/** Campos do índice único violado: `meta.target` ou, com driver adapter, `constraint.fields`. */
function uniqueFields(meta: Record<string, unknown> | undefined): string[] {
  const target = meta?.target;
  if (Array.isArray(target)) {
    return target.filter((field): field is string => typeof field === 'string');
  }
  const adapterError = meta?.driverAdapterError;
  const cause = isRecord(adapterError) ? adapterError.cause : undefined;
  const constraint = isRecord(cause) ? cause.constraint : undefined;
  const fields = isRecord(constraint) ? constraint.fields : undefined;
  return Array.isArray(fields)
    ? fields.filter((field): field is string => typeof field === 'string')
    : [];
}

/** Só os códigos mapeados viram resposta própria; a mensagem do banco nunca sai daqui. */
function fromPrisma(exception: PrismaKnownError): Translated | undefined {
  if (exception.code === 'P2002') {
    const fields = uniqueFields(exception.meta);
    return {
      statusCode: HttpStatus.CONFLICT,
      message:
        fields.length > 0
          ? `Já existe um registro com este valor: ${fields.join(', ')}.`
          : 'Já existe um registro com este valor.',
    };
  }
  if (exception.code === 'P2025') {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Registro não encontrado.',
    };
  }
  return undefined;
}

function fromHttp(exception: HttpException): Translated {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return { statusCode, message: response };
  }
  if (!isRecord(response)) {
    return { statusCode, message: exception.message };
  }
  const { message, fields } = response;
  return {
    statusCode,
    message: Array.isArray(message)
      ? message.join('; ')
      : typeof message === 'string'
        ? message
        : exception.message,
    fields: isRecord(fields) ? (fields as ErrorFields) : undefined,
  };
}

/**
 * Filtro global: todo erro sai no mesmo formato. Erro do Nest passa com o
 * próprio status; P2002 e P2025 do Prisma viram 409 e 404; o resto vira 500
 * genérico, com o detalhe só no log.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequestLike>();
    const response = http.getResponse<HttpResponseLike>();
    const where = `${request.method} ${request.url}`;

    const translated = this.translate(exception, where);

    response.status(translated.statusCode).json({
      statusCode: translated.statusCode,
      error: STATUS_CODES[translated.statusCode] ?? 'Error',
      message: translated.message,
      ...(translated.fields ? { fields: translated.fields } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private translate(exception: unknown, where: string): Translated {
    if (exception instanceof HttpException) {
      const translated = fromHttp(exception);
      if (translated.statusCode >= 500) {
        this.logger.error(where, exception.stack);
      } else if (translated.statusCode === 422) {
        // Regra de negócio violada: é o sistema funcionando, não um defeito.
        this.logger.warn(`${where} — ${translated.message}`);
      }
      return translated;
    }

    const known = isPrismaKnownError(exception)
      ? fromPrisma(exception)
      : undefined;
    if (known) {
      return known;
    }

    this.logger.error(
      where,
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: GENERIC_MESSAGE,
    };
  }
}
