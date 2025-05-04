import { UserRole } from '@/enums';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { ForbiddenError } from '@/utils/ApiError';
import { ExpressMiddlewareInterface } from 'routing-controllers';

export function RoleMiddleware(requiredRoles: UserRole | UserRole[]) {
  return class RoleCheckerMiddleware implements ExpressMiddlewareInterface {
    async use(req: RequestWithUser, res: any, next?: (err?: any) => any) {
      try {
        const user = req.user;
        if (!user) {
          return next(new ForbiddenError('User not authenticated'));
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!roles.includes(user.role)) {
          return next(new ForbiddenError());
        }

        return next();
      } catch (error) {
        next(new ForbiddenError('Role verification failed'));
      }
    }
  };
}
