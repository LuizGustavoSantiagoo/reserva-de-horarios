import { slotStatus } from './slot-status.js';

describe('slotStatus', () => {
  it('horário sem bloqueio fica livre', () => {
    expect(slotStatus({ blocked: false })).toBe('FREE');
  });

  it('bloqueado vence livre', () => {
    expect(slotStatus({ blocked: true })).toBe('BLOCKED');
  });
});
