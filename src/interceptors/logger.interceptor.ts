import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
    constructor(private readonly systemLogsService: SystemLogsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, user, originalUrl } = req;

        const entity = originalUrl.split('/')[1] || 'unknown';
        let action: string | null = null;

        switch (method) {
            case 'POST':
                action = 'CREATE';
                break;
            case 'PATCH':
            case 'PUT':
                action = 'UPDATE';
                break;
            case 'DELETE':
                action = 'DELETE';
                break;
            default:
                action = null;
        }
        const start = Date.now();
        return next.handle().pipe(
            tap(() => {
                if (!action) return;
                const duration = Date.now() - start;
                const logEntry = {
                    userId: user?.id,
                    entity,
                    action,
                    description: `${user?.email} performed ${action} on ${entity}`,
                    duration,
                };
                void this.systemLogsService.create(logEntry);
            })
        );
    }
}
