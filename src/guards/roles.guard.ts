import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { User } from 'src/users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!requiredRoles) return true;

        const request = context.switchToHttp().getRequest();
        const user: User = request.user;

        if (!user) {
            throw new ForbiddenException('User not found in request');
        }

        // Check if user has at least one required role
        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException('You do not have permission (roles)');
        }

        return true;
    }
}
