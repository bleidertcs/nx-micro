import { Injectable } from '@nestjs/common';
import { JwtService } from '../../infrastructure/security/jwt.service';

export interface ValidateTokenDto {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
  };
}

@Injectable()
export class ValidateTokenUseCase {
  constructor(private readonly jwtService: JwtService) {}

  async execute(dto: ValidateTokenDto): Promise<ValidateTokenResponse> {
    try {
      const decoded = this.jwtService.verifyAccessToken(dto.token);
      return {
        valid: true,
        user: {
          id: decoded.sub,
          email: decoded.email,
        },
      };
    } catch (error) {
      return {
        valid: false,
      };
    }
  }
}
