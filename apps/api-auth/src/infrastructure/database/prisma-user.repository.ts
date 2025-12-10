import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@nx-microservices/test_micro';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { NestLoggerService } from '@nx-microservices/observability';


@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: NestLoggerService
  ) {}



  async create(
    email: string,
    hashedPassword: string,
    name: string
  ): Promise<User> {
    this.logger.log('Creating user', JSON.stringify({ email }));

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    this.logger.log('User created successfully', JSON.stringify({ userId: user.id }));

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
    this.logger.log('Finding user by email', JSON.stringify({ email }));

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.log('User not found', JSON.stringify({ email }));
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
    this.logger.log('Finding user by ID', JSON.stringify({ userId: id }));

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.log('User not found', JSON.stringify({ userId: id }));
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
    this.logger.log('Saving refresh token', JSON.stringify({ userId }));

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    this.logger.log('Refresh token saved', JSON.stringify({ userId }));
  }

  async findRefreshToken(
    token: string
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    this.logger.log('Finding refresh token');

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      this.logger.log('Refresh token not found');
      return null;
    }

    return {
      userId: refreshToken.userId,
      expiresAt: refreshToken.expiresAt,
    };
  }

  async deleteRefreshToken(token: string): Promise<void> {
    this.logger.log('Deleting refresh token');

    await this.prisma.refreshToken.delete({
      where: { token },
    });

    this.logger.log('Refresh token deleted');
  }

  // Password reset methods
  async savePasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    this.logger.log('Saving password reset token', JSON.stringify({ userId }));

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    this.logger.log('Password reset token saved', JSON.stringify({ userId }));
  }

  async findPasswordResetToken(
    token: string
  ): Promise<{ userId: string; expiresAt: Date; used: boolean } | null> {
    this.logger.log('Finding password reset token');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      this.logger.log('Password reset token not found');
      return null;
    }

    return {
      userId: resetToken.userId,
      expiresAt: resetToken.expiresAt,
      used: resetToken.used,
    };
  }

  async markResetTokenAsUsed(token: string): Promise<void> {
    this.logger.log('Marking reset token as used');

    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    this.logger.log('Reset token marked as used');
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    this.logger.log('Deleting password reset token');

    await this.prisma.passwordResetToken.delete({
      where: { token },
    });

    this.logger.log('Password reset token deleted');
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    this.logger.log('Updating user password', JSON.stringify({ userId }));

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log('User password updated', JSON.stringify({ userId }));
  }

  async updateProfile(userId: string, name: string): Promise<User> {
    this.logger.log('Updating user profile', JSON.stringify({ userId }));

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });

    this.logger.log('User profile updated', JSON.stringify({ userId }));

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
