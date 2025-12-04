import { Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class VerifyResetTokenUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  async execute(data: { token: string }): Promise<{
    valid: boolean;
    userId?: string;
    message?: string;
  }> {
    this.logger.info('Verifying reset token');

    // Find token in database
    const resetToken = await this.userRepository.findPasswordResetToken(
      data.token
    );

    if (!resetToken) {
      this.logger.warn('Reset token not found');
      return {
        valid: false,
        message: 'Invalid or expired reset token',
      };
    }

    // Check if token has been used
    if (resetToken.used) {
      this.logger.warn('Reset token already used');
      return {
        valid: false,
        message: 'This reset token has already been used',
      };
    }

    // Check if token has expired
    const now = new Date();
    if (now > resetToken.expiresAt) {
      this.logger.warn('Reset token expired');
      return {
        valid: false,
        message: 'Reset token has expired',
      };
    }

    this.logger.info('Reset token is valid', { userId: resetToken.userId });

    return {
      valid: true,
      userId: resetToken.userId,
    };
  }
}
