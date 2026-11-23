import type { Provider } from '@nestjs/common';

/** Fonte única do instante atual: a regra pede o `now` aqui, nunca a `new Date()`. */
export interface Clock {
  now(): Date;
}

/** Token de injeção do relógio; os testes o trocam com `overrideProvider(CLOCK)`. */
export const CLOCK = Symbol('CLOCK');

export const systemClock: Clock = { now: () => new Date() };

export const clockProvider: Provider = {
  provide: CLOCK,
  useValue: systemClock,
};
