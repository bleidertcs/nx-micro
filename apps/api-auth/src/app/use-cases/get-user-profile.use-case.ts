import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository.interface';

export interface GetUserProfileResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository
  ) {}

  async execute(userId: string): Promise<GetUserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.toJSON();
  }
}
