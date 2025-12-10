import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { NestLoggerService } from '@nx-microservices/observability';


@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: NestLoggerService) { }


    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const errorResponse = exception instanceof HttpException
            ? exception.getResponse()
            : { message: 'Internal server error' };

        const logData = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: typeof errorResponse === 'string' ? errorResponse : (errorResponse as any).message,
            stack: exception.stack,
        };

        this.logger.error('HTTP Exception', JSON.stringify(logData));


        response.status(status).json({
            ...logData,
            ...(typeof errorResponse === 'object' && errorResponse),
        });
    }
}
