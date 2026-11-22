import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

/** Imita o erro que o Prisma lança: mesma `name`, `code` e `meta` do original. */
function prismaError(
  code: string,
  meta: Record<string, unknown>,
  message: string,
) {
  const error = new Error(message);
  error.name = 'PrismaClientKnownRequestError';
  return Object.assign(error, { code, meta, clientVersion: '7.10.1' });
}

const DB_MESSAGE =
  'Invalid `prisma.reservation.create()` invocation: Unique constraint failed on the fields: (`courtId`,`startsAt`) SELECT "public"."Reservation"."id" FROM "Reservation"';

describe('AllExceptionsFilter', () => {
  let json: ReturnType<typeof vi.fn>;
  let status: ReturnType<typeof vi.fn>;
  let host: ArgumentsHost;
  let logError: ReturnType<typeof vi.spyOn>;
  let logWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    json = vi.fn();
    status = vi.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'POST', url: '/reservations' }),
      }),
    } as unknown as ArgumentsHost;
    logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    logWarn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function body(): Record<string, unknown> {
    return json.mock.calls[0][0] as Record<string, unknown>;
  }

  it('mantém o status e a mensagem de um erro do Nest, no formato único', () => {
    new AllExceptionsFilter().catch(
      new NotFoundException('Quadra não encontrada'),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(body()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Quadra não encontrada',
      path: '/reservations',
      timestamp: expect.any(String),
    });
  });

  it('repassa os campos de um erro de validação em `fields`', () => {
    new AllExceptionsFilter().catch(
      new BadRequestException({
        message: 'Dados inválidos',
        fields: { date: ['date deve ser uma data válida'] },
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(body()).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Dados inválidos',
      fields: { date: ['date deve ser uma data válida'] },
    });
  });

  it('registra como aviso a regra de negócio violada (422)', () => {
    new AllExceptionsFilter().catch(
      new UnprocessableEntityException('Cancelamento permitido até 24h antes.'),
      host,
    );

    expect(status).toHaveBeenCalledWith(422);
    expect(logWarn).toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });

  it('traduz P2002 (registro duplicado) em 409, dizendo o campo e sem vazar o banco', () => {
    new AllExceptionsFilter().catch(
      prismaError(
        'P2002',
        { modelName: 'Reservation', target: ['courtId', 'startsAt'] },
        DB_MESSAGE,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(body()).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'Já existe um registro com este valor: courtId, startsAt.',
    });
    const sent = JSON.stringify(body());
    expect(sent).not.toContain('prisma');
    expect(sent).not.toContain('Reservation');
    expect(sent).not.toContain('SELECT');
  });

  it('lê o campo do P2002 também no formato do driver adapter', () => {
    new AllExceptionsFilter().catch(
      prismaError(
        'P2002',
        {
          driverAdapterError: { cause: { constraint: { fields: ['email'] } } },
        },
        DB_MESSAGE,
      ),
      host,
    );

    expect(body()).toMatchObject({
      statusCode: 409,
      message: 'Já existe um registro com este valor: email.',
    });
  });

  it('traduz P2025 (registro inexistente) em 404, sem vazar o banco', () => {
    new AllExceptionsFilter().catch(
      prismaError(
        'P2025',
        { modelName: 'Court', cause: 'No record was found for an update.' },
        'Invalid `prisma.court.update()` invocation: No record was found for an update.',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(body()).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Registro não encontrado.',
    });
    expect(JSON.stringify(body())).not.toContain('Court');
  });

  it('responde 500 genérico a outro erro do Prisma e manda o detalhe só para o log', () => {
    new AllExceptionsFilter().catch(prismaError('P2003', {}, DB_MESSAGE), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(body()).toMatchObject({ statusCode: 500, message: 'Erro interno.' });
    expect(JSON.stringify(body())).not.toContain('Reservation');
    expect(logError).toHaveBeenCalledWith(
      'POST /reservations',
      expect.stringContaining('Reservation'),
    );
  });

  it('responde 500 genérico a um erro inesperado, sem mensagem nem stack', () => {
    new AllExceptionsFilter().catch(
      new Error('connect ECONNREFUSED 10.0.0.5:5432 password=segredo'),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(body()).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Erro interno.',
      path: '/reservations',
      timestamp: expect.any(String),
    });
    expect(logError).toHaveBeenCalledWith(
      'POST /reservations',
      expect.stringContaining('ECONNREFUSED'),
    );
  });

  it('aguenta algo que não é Error (throw de texto)', () => {
    new AllExceptionsFilter().catch('explodiu', host);

    expect(status).toHaveBeenCalledWith(500);
    expect(logError).toHaveBeenCalledWith('POST /reservations', 'explodiu');
  });
});
