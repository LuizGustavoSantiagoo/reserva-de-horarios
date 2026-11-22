import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { UsersService } from '../users/users.service.js';
import type { AccessTokenDto } from './dto/access-token.dto.js';

// A mesma recusa para e-mail inexistente e senha errada: a resposta não diz se a conta existe.
const INVALID_CREDENTIALS = 'E-mail ou senha inválidos.';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /** Confere e-mail (já normalizado) e senha e emite o token do painel. */
  async login(email: string, password: string): Promise<AccessTokenDto> {
    const user = await this.users.findCredentialsByEmail(email);

    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Só o id e o papel: o @nestjs/jwt acrescenta iat e exp, e nada sigiloso entra no token.
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });
    return { accessToken };
  }
}
