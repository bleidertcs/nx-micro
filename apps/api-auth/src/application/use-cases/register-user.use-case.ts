import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { BcryptService } from '../../infrastructure/security/bcrypt.service';

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
}

export interface RegisterUserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService
  ) {}

  async execute(dto: RegisterUserDto): Promise<RegisterUserResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.bcryptService.hash(dto.password);

    // Create user
    const user = await this.userRepository.create(
      dto.email,
      hashedPassword,
      dto.name
    );

    // Return user without password
    return user.toJSON();
  }
}
