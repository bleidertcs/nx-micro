import { Catch, ArgumentsHost, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { NestLoggerService } from '@nx-microservices/observability';


@Catch(RpcException)
export class RpcCustomExceptionFilter implements RpcExceptionFilter<RpcException> {
    constructor(private readonly logger: NestLoggerService) {}

    catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
        const error = exception.getError();
        this.logger.error(`RPC Exception: ${JSON.stringify(error)}`, 'RpcCustomExceptionFilter');

        return throwError(() => error);
    }
}

