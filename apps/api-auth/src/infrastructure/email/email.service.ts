import { Injectable, Inject } from '@nestjs/common';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class EmailService {
  constructor(@Inject(LOGGER_TOKEN) private readonly logger: Logger) {}

  /**
   * Mock implementation: Sends a password reset email
   * In production, integrate with SendGrid, AWS SES, or similar
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    this.logger.info(
      '📧 [MOCK EMAIL] Password Reset Email',
      {
        to: email,
        resetToken,
        resetLink: `http://localhost:3000/reset-password?token=${resetToken}`,
      }
    );

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.info('Email sent successfully (mock)', { to: email });
  }

  /**
   * Mock implementation: Sends a welcome email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    this.logger.info(
      '📧 [MOCK EMAIL] Welcome Email',
      {
        to: email,
        name,
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    
    this.logger.info('Welcome email sent successfully (mock)', { to: email });
  }
}
