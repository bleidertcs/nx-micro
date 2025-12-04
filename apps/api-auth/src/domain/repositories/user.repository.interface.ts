import { User } from '../entities/user.entity';

export interface UserRepository {
  create(email: string, hashedPassword: string, name: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void>;
  findRefreshToken(
    token: string
  ): Promise<{ userId: string; expiresAt: Date } | null>;
  deleteRefreshToken(token: string): Promise<void>;
  
  // Password reset methods
  savePasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<void>;
  findPasswordResetToken(
    token: string
  ): Promise<{ userId: string; expiresAt: Date; used: boolean } | null>;
  markResetTokenAsUsed(token: string): Promise<void>;
  deletePasswordResetToken(token: string): Promise<void>;
  
  // Password and profile update methods
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  updateProfile(userId: string, name: string): Promise<User>;
}
