// Recusa do link da grade (CA11), já no vocabulário da tela: a página não conhece status HTTP
// nem os campos do DTO (architecture §4). Fica fora do `grade.service.ts` para a página e os
// testes dela usarem a classe sem carregar o cliente da API.

/** `court`: a quadra não existe ou está inativa; `day`: o dia é inválido ou já passou. */
export type GradeRefusalReason = 'court' | 'day'

export class GradeRefusal extends Error {
  readonly reason: GradeRefusalReason

  constructor(reason: GradeRefusalReason, message: string) {
    super(message)
    this.name = 'GradeRefusal'
    this.reason = reason
  }
}
