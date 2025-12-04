import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    Request,
    Inject,
    UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
    RegisterUserDto,
    LoginUserDto,
    RefreshTokenDto,
    ValidateTokenDto,
} from '@nx-microservices/shared-dtos';
import { RequestPasswordResetDto } from '../dtos/request-password-reset.dto';
import { VerifyResetTokenDto } from '../dtos/verify-reset-token.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { SERVICES } from '../../config/constants';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        @Inject(SERVICES.API_AUTH) private readonly authService: ClientProxy
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() dto: RegisterUserDto) {
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.register' }, dto)
        );
    }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'User successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginUserDto) {
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.login' }, dto)
        );
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Body() dto: RefreshTokenDto) {
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.refresh' }, dto)
        );
    }

    @Post('validate')
    @ApiOperation({ summary: 'Validate JWT token' })
    @ApiResponse({ status: 200, description: 'Token is valid' })
    async validate(@Body() dto: ValidateTokenDto) {
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.validate' }, dto)
        );
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'User profile retrieved' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Request() req: any) {
        const userId = req.user?.id;
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.profile' }, { userId })
        );
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update user profile' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
        const userId = req.user?.id;
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.update-profile' }, { userId, ...dto })
        );
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Change password for authenticated user' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid current password or unauthorized' })
    async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        const userId = req.user?.id;
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.change-password' }, { userId, ...dto })
        );
    }

    @Post('request-password-reset')
    @ApiOperation({ summary: 'Request password reset email' })
    @ApiResponse({ status: 200, description: 'Password reset email sent if email exists' })
    async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.request-password-reset' }, dto)
        );
    }

    @Post('verify-reset-token')
    @ApiOperation({ summary: 'Verify password reset token validity' })
    @ApiResponse({ status: 200, description: 'Token verification result' })
    async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.verify-reset-token' }, dto)
        );
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return firstValueFrom(
            this.authService.send({ cmd: 'auth.reset-password' }, dto)
        );
    }
}
