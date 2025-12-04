import { Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { BcryptService } from '../../infrastructure/security/bcrypt.service';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  async execute(data: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    this.logger.info('Changing password for user', { userId: data.userId });

    // Validate new password strength
    if (!data.newPassword || data.newPassword.length < 6) {
      throw new RpcException({
        statusCode: 400,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Find user
    const user = await this.userRepository.findById(data.userId);

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await this.bcryptService.compare(
      data.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new RpcException({
        statusCode: 401,
        message: 'Current password is incorrect',
      });
    }

    // Check if new password is same as current
    const isSamePassword = await this.bcryptService.compare(
      data.newPassword,
      user.password
    );

    if (isSamePassword) {
      throw new RpcException({
        statusCode: 400,
        message: 'New password must be different from current password',
      });
    }

    // Hash new password
    const hashedPassword = await this.bcryptService.hash(data.newPassword);

    // Update password
    await this.userRepository.updatePassword(user.id, hashedPassword);

    this.logger.info('Password changed successfully', { userId: user.id });

    return {
      message: 'Password changed successfully',
    };
  }
}
