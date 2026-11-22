import { slotStatus } from './slot-status.js';

// Relógio fixo: 10h de domingo em São Paulo (UTC-3).
const NOW = new Date('2030-06-02T13:00:00.000Z');
const PAST = new Date('2030-06-02T12:00:00.000Z');
const FUTURE = new Date('2030-06-02T14:00:00.000Z');

describe('slotStatus', () => {
  describe('horário que ainda não começou', () => {
    it('horário sem bloqueio nem reserva fica livre', () => {
      expect(slotStatus({ startsAt: FUTURE, blocked: false }, NOW)).toBe(
        'FREE',
      );
    });

    it('bloqueado vence livre', () => {
      expect(slotStatus({ startsAt: FUTURE, blocked: true }, NOW)).toBe(
        'BLOCKED',
      );
    });

    it('reserva confirmada deixa o horário reservado', () => {
      expect(
        slotStatus(
          { startsAt: FUTURE, blocked: false, reservationStatus: 'CONFIRMED' },
          NOW,
        ),
      ).toBe('RESERVED');
    });

    it('bloqueado vence reservado', () => {
      expect(
        slotStatus(
          { startsAt: FUTURE, blocked: true, reservationStatus: 'CONFIRMED' },
          NOW,
        ),
      ).toBe('BLOCKED');
    });

    // A função não recebe prazo nenhum: pré-reserva com os 3 minutos vencidos ou
    // pendente com a cobrança vencida continua em reserva até o status gravado mudar (CA7).
    it.each(['HELD', 'PENDING'] as const)(
      'reserva %s deixa o horário em reserva, só pelo status gravado',
      (reservationStatus) => {
        expect(
          slotStatus(
            { startsAt: FUTURE, blocked: false, reservationStatus },
            NOW,
          ),
        ).toBe('HELD');
      },
    );

    it.each(['EXPIRED', 'CANCELLED'] as const)(
      'reserva %s não ocupa o horário: ele fica livre',
      (reservationStatus) => {
        expect(
          slotStatus(
            { startsAt: FUTURE, blocked: false, reservationStatus },
            NOW,
          ),
        ).toBe('FREE');
      },
    );
  });

  // "Já começou" = início igual ou anterior ao instante atual (CA5).
  describe.each([
    ['começou agora (início igual ao now)', NOW],
    ['começou antes do now', PAST],
  ])('horário que %s', (_, startsAt) => {
    it('livre fica indisponível', () => {
      expect(slotStatus({ startsAt, blocked: false }, NOW)).toBe('UNAVAILABLE');
    });

    it.each(['EXPIRED', 'CANCELLED'] as const)(
      'com reserva %s (livre) fica indisponível',
      (reservationStatus) => {
        expect(
          slotStatus({ startsAt, blocked: false, reservationStatus }, NOW),
        ).toBe('UNAVAILABLE');
      },
    );

    it.each(['HELD', 'PENDING'] as const)(
      'em reserva (%s) fica indisponível',
      (reservationStatus) => {
        expect(
          slotStatus({ startsAt, blocked: false, reservationStatus }, NOW),
        ).toBe('UNAVAILABLE');
      },
    );

    it('reservado continua reservado', () => {
      expect(
        slotStatus(
          { startsAt, blocked: false, reservationStatus: 'CONFIRMED' },
          NOW,
        ),
      ).toBe('RESERVED');
    });

    it('bloqueado continua bloqueado, mesmo com reserva', () => {
      expect(slotStatus({ startsAt, blocked: true }, NOW)).toBe('BLOCKED');
      expect(
        slotStatus(
          { startsAt, blocked: true, reservationStatus: 'CONFIRMED' },
          NOW,
        ),
      ).toBe('BLOCKED');
    });
  });
});
