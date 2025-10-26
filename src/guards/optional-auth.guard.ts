import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/users/user.entity';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(
        err: unknown,
        user: User | null,
        info: unknown,
        context: ExecutionContext
    ): any {
        // If there's a valid user, attach it; otherwise just return null
        if (err || info || !user) {
            return null;
        }
        return user;
    }
}
