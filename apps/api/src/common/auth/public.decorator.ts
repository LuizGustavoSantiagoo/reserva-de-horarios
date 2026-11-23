import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca a rota (ou o controller inteiro) como pública: o AuthGuard global deixa
 * passar sem olhar o cabeçalho `Authorization`. Sem esta marca, toda rota exige token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
