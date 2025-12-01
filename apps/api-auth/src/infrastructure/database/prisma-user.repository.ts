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
}
