import { slotStatus } from './slot-status.js';

describe('slotStatus', () => {
  it('horário sem bloqueio nem reserva fica livre', () => {
    expect(slotStatus({ blocked: false })).toBe('FREE');
  });

  it('bloqueado vence livre', () => {
    expect(slotStatus({ blocked: true })).toBe('BLOCKED');
  });

  it('reserva confirmada deixa o horário reservado', () => {
    expect(slotStatus({ blocked: false, reservationStatus: 'CONFIRMED' })).toBe(
      'RESERVED',
    );
  });

  it('bloqueado vence reservado', () => {
    expect(slotStatus({ blocked: true, reservationStatus: 'CONFIRMED' })).toBe(
      'BLOCKED',
    );
  });

  // A função não recebe prazo nenhum: pré-reserva com os 3 minutos vencidos ou
  // pendente com a cobrança vencida continua em reserva até o status gravado mudar (CA7).
  it.each(['HELD', 'PENDING'] as const)(
    'reserva %s deixa o horário em reserva, só pelo status gravado',
    (reservationStatus) => {
      expect(slotStatus({ blocked: false, reservationStatus })).toBe('HELD');
    },
  );

  it.each(['EXPIRED', 'CANCELLED'] as const)(
    'reserva %s não ocupa o horário: ele fica livre',
    (reservationStatus) => {
      expect(slotStatus({ blocked: false, reservationStatus })).toBe('FREE');
    },
  );
});
