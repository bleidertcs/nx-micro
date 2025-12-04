import { Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  async execute(data: { userId: string; name: string }): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }> {
    this.logger.info('Updating user profile', { userId: data.userId });

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new RpcException({
        statusCode: 400,
        message: 'Name cannot be empty',
      });
    }

    // Find user
    const existingUser = await this.userRepository.findById(data.userId);

    if (!existingUser) {
      throw new RpcException({
        statusCode: 404,
        message: 'User not found',
      });
    }

    // Update profile
    const updatedUser = await this.userRepository.updateProfile(
      data.userId,
      data.name.trim()
    );

    this.logger.info('User profile updated successfully', {
      userId: updatedUser.id,
    });

    return {
      user: updatedUser.toJSON(),
    };
  }
}
