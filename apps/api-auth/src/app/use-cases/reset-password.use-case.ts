import { Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { BcryptService } from '../../infrastructure/security/bcrypt.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  async execute(data: {
    token: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    this.logger.info('Resetting password');

    // Validate password strength
    if (!data.newPassword || data.newPassword.length < 6) {
      throw new RpcException({
        statusCode: 400,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Find and validate token
    const resetToken = await this.userRepository.findPasswordResetToken(
      data.token
    );

    if (!resetToken) {
      throw new RpcException({
        statusCode: 400,
        message: 'Invalid or expired reset token',
      });
    }

    // Check if token has been used
    if (resetToken.used) {
      throw new RpcException({
        statusCode: 400,
        message: 'This reset token has already been used',
      });
    }

    // Check if token has expired
    const now = new Date();
    if (now > resetToken.expiresAt) {
      throw new RpcException({
        statusCode: 400,
        message: 'Reset token has expired',
      });
    }

    // Hash new password
    const hashedPassword = await this.bcryptService.hash(data.newPassword);

    // Update user password
    await this.userRepository.updatePassword(
      resetToken.userId,
      hashedPassword
    );

    // Mark token as used
    await this.userRepository.markResetTokenAsUsed(data.token);

    this.logger.info('Password reset successfully', {
      userId: resetToken.userId,
    });

    return {
      message: 'Password has been reset successfully',
    };
  }
}
