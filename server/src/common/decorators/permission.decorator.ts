import { SetMetadata } from '@nestjs/common';

export enum AppModule {
  ADMIN = 'admin',
  GROUP = 'group',
  USER = 'user',
  DASHBOARD = 'dashboard',
  CATEGORY = 'category',
  SAMPLE = 'sample',
}

export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export const PERMISSION_CHECK_KEY = 'permission_check';

export interface PermissionCheck {
  moduleId: AppModule | string;
  action: PermissionAction | string;
}

export const RequirePermission = (
  moduleId: AppModule | string,
  action: PermissionAction | string,
) => SetMetadata(PERMISSION_CHECK_KEY, { moduleId, action });
