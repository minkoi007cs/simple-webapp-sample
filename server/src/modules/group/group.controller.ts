import { Controller, Get, Post, Body, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveGroupGuard } from '../../common/guards/active-group.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission, AppModule, PermissionAction } from '../../common/decorators/permission.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../common/entities/user.entity';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveGroupGuard, PermissionGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo nhóm mới' })
  create(
    @GetUser() user: User,
    @Body() body: { name: string; description?: string },
  ) {
    return this.groupService.create(user.id, body);
  }

  @Get('current')
  @RequirePermission(AppModule.GROUP, PermissionAction.VIEW)
  @ApiOperation({ summary: 'Lấy thông tin nhóm hiện tại' })
  getCurrent(@GetUser() user: User) {
    const groupId = user.lastActiveGroupId!;
    return this.groupService.findOne(groupId);
  }

  @Patch('current')
  @RequirePermission(AppModule.GROUP, PermissionAction.UPDATE)
  @ApiOperation({ summary: 'Cập nhật nhóm hiện tại' })
  updateCurrent(
    @GetUser() user: User,
    @Body() body: { name?: string; description?: string; settings?: Record<string, any> },
  ) {
    const groupId = user.lastActiveGroupId!;
    return this.groupService.update(groupId, body);
  }
}
