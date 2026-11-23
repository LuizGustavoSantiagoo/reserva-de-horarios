import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service.js';

// Só a leitura que a grade usa; compra, pré-reserva, cancelamento e expiração
// (controller e rotas) chegam com a US02 (#3) e as seguintes.
@Module({
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
