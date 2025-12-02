import {
    Controller,
    Post,
    Get,
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
}
