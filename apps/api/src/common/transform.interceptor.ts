import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Envelope<T> {
  data: T;
}

/** Toda resposta de sucesso sai como `{ data: ... }` (architecture §2.1, item 5). */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Envelope<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Envelope<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
