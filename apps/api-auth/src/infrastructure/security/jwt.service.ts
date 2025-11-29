import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { envs } from '../../config/envs';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: envs.jwtSecret,
      expiresIn: envs.jwtAccessExpiration as any,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: envs.jwtSecret,
      expiresIn: envs.jwtRefreshExpiration as any,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: envs.jwtSecret,
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: envs.jwtSecret,
    });
  }
}
