import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { JwtService } from '../../infrastructure/security/jwt.service';

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async execute(dto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    // Verify refresh token
    let decoded;
    try {
      decoded = this.jwtService.verifyRefreshToken(dto.refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists in database
    const storedToken = await this.userRepository.findRefreshToken(
      dto.refreshToken
    );
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await this.userRepository.deleteRefreshToken(dto.refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new access token
    const payload = { sub: decoded.sub, email: decoded.email };
    const accessToken = this.jwtService.generateAccessToken(payload);

    // Optionally rotate refresh token
    const newRefreshToken = this.jwtService.generateRefreshToken(payload);
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Delete old refresh token and save new one
    await this.userRepository.deleteRefreshToken(dto.refreshToken);
    await this.userRepository.saveRefreshToken(
      decoded.sub,
      newRefreshToken,
      refreshTokenExpiry
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
