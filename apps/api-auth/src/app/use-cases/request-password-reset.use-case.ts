import { Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { randomBytes } from 'crypto';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { EmailService } from '../../infrastructure/email/email.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  async execute(data: { email: string }): Promise<{ message: string }> {
    this.logger.info('Requesting password reset', { email: data.email });

    // Find user by email
    const user = await this.userRepository.findByEmail(data.email);

    if (!user) {
      // For security reasons, don't reveal if the email exists or not
      this.logger.warn('Password reset requested for non-existent email', {
        email: data.email,
      });
      return {
        message:
          'If the email exists, a password reset link has been sent.',
      };
    }

    // Generate secure random token
    const resetToken = randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    await this.userRepository.savePasswordResetToken(
      user.id,
      resetToken,
      expiresAt
    );

    // Send email with reset link
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    this.logger.info('Password reset email sent', {
      userId: user.id,
      email: user.email,
    });

    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }
}
