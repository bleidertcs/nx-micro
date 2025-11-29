import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SERVICES } from '../../config/constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        @Inject(SERVICES.API_AUTH) private readonly authClient: ClientProxy,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const response = await firstValueFrom(
                this.authClient.send({ cmd: 'auth.validate' }, { token }),
            );

            if (!response.valid || !response.user) {
                throw new UnauthorizedException();
            }

            // 💡 We're assigning the user object to the request object here
            request.user = response.user;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
