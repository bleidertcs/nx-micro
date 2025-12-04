import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@nx-microservices/test_micro';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { LOGGER_TOKEN } from '@nx-microservices/observability';
import { Logger } from 'winston';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger
  ) {}

  async create(
    email: string,
    hashedPassword: string,
    name: string
  ): Promise<User> {
    this.logger.info('Creating user', { email });

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    this.logger.info('User created successfully', { userId: user.id });

    return User.create(
      user.id,
      user.email,
      user.password,
      user.name,
      user.createdAt,
      user.updatedAt
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.info('Finding user by email', { email });

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.info('User not found', { email });
      return null;
    }

    return User.create(
      user.id,
      user.email,
      user.password,
      user.name,
      user.createdAt,
      user.updatedAt
    );
  }

  async findById(id: string): Promise<User | null> {
    this.logger.info('Finding user by ID', { userId: id });

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.info('User not found', { userId: id });
      return null;
    }

    return User.create(
      user.id,
      user.email,
      user.password,
      user.name,
      user.createdAt,
      user.updatedAt
    );
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    this.logger.info('Saving refresh token', { userId });

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    this.logger.info('Refresh token saved', { userId });
  }

  async findRefreshToken(
    token: string
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    this.logger.info('Finding refresh token');

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      this.logger.info('Refresh token not found');
      return null;
    }

    return {
      userId: refreshToken.userId,
      expiresAt: refreshToken.expiresAt,
    };
  }

  async deleteRefreshToken(token: string): Promise<void> {
    this.logger.info('Deleting refresh token');

    await this.prisma.refreshToken.delete({
      where: { token },
    });

    this.logger.info('Refresh token deleted');
  }

  // Password reset methods
  async savePasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    this.logger.info('Saving password reset token', { userId });

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    this.logger.info('Password reset token saved', { userId });
  }

  async findPasswordResetToken(
    token: string
  ): Promise<{ userId: string; expiresAt: Date; used: boolean } | null> {
    this.logger.info('Finding password reset token');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      this.logger.info('Password reset token not found');
      return null;
    }

    return {
      userId: resetToken.userId,
      expiresAt: resetToken.expiresAt,
      used: resetToken.used,
    };
  }

  async markResetTokenAsUsed(token: string): Promise<void> {
    this.logger.info('Marking reset token as used');

    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    this.logger.info('Reset token marked as used');
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    this.logger.info('Deleting password reset token');

    await this.prisma.passwordResetToken.delete({
      where: { token },
    });

    this.logger.info('Password reset token deleted');
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    this.logger.info('Updating user password', { userId });

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.info('User password updated', { userId });
  }

  async updateProfile(userId: string, name: string): Promise<User> {
    this.logger.info('Updating user profile', { userId });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    this.logger.info('User profile updated', { userId });

    return User.create(
      updatedUser.id,
      updatedUser.email,
      updatedUser.password,
      updatedUser.name,
      updatedUser.createdAt,
      updatedUser.updatedAt
    );
  }
}
