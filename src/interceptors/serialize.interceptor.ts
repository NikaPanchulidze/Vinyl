import {
    CallHandler,
    ExecutionContext,
    NestInterceptor,
    UseInterceptors,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ClassConstructor {
    new (...args: any[]): {};
}

export function Serialize(dto: ClassConstructor) {
    return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
    constructor(private dto: ClassConstructor) {}

    intercept(
        context: ExecutionContext,
        handler: CallHandler
    ): Observable<object> {
        // Run something before a request is handled by the request handler

        return handler.handle().pipe(
            map((data: any) => {
                // Run something before the response is sent out

                return plainToClass(this.dto, data, {
                    excludeExtraneousValues: true,
                }) as object;
            })
        );
    }
}
