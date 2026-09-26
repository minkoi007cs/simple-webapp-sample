import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_CHECK_KEY, PermissionCheck } from '../decorators/permission.decorator';
import { SystemRole, UserRole } from '../entities/user.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const check = this.reflector.getAllAndOverride<PermissionCheck>(
      PERMISSION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!check) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      this.logger.warn('No user found in request');
      return false;
    }

    const moduleKey = String(check.moduleId).toLowerCase();
    const action = String(check.action).toLowerCase();

    // 1. Quản trị hệ thống (APP_ADMIN)
    if (user.systemRole === SystemRole.APP_ADMIN) {
      return true;
    }

    // 2. Không cho phép user thường truy cập module admin
    if (moduleKey === 'admin') {
      throw new ForbiddenException('Chỉ Quản trị viên hệ thống (APP_ADMIN) mới có quyền truy cập');
    }

    // 3. Quyền theo nhóm
    if (!user.role) {
      throw new ForbiddenException('Chưa chọn nhóm làm việc hoặc không có quyền');
    }

    const groupRole = user.role;

    if (groupRole === UserRole.GROUP_ADMIN) {
      return true;
    }

    if (groupRole === UserRole.MEMBER) {
      if (action === 'view') {
        return true;
      }
      if (moduleKey === 'sample') {
        return true;
      }
      if (action === 'create' || action === 'update' || action === 'delete') {
        if (moduleKey === 'category' || moduleKey === 'user' || moduleKey === 'group') {
          throw new ForbiddenException('Chỉ Quản trị viên nhóm (GROUP_ADMIN) mới có quyền thực hiện thao tác này');
        }
      }
      return true;
    }

    return false;
  }
}
