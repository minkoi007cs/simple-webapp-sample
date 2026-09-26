import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupStatus } from '../../common/entities/group.entity';
import { SystemRole, User, UserRole } from '../../common/entities/user.entity';
import { GroupUser, GroupUserStatus } from '../../common/entities/group-user.entity';
import { Role } from '../../common/entities/role.entity';
import { CategoryService } from '../category/category.service';
import { GroupService } from '../group/group.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GroupUser)
    private groupUserRepository: Repository<GroupUser>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private categoryService: CategoryService,
    private groupService: GroupService,
  ) {}

  async findAllGroups() {
    const groups = await this.groupRepository.find({
      order: { createdAt: 'ASC' },
    });

    const memberships = await this.groupUserRepository.find({
      where: { status: GroupUserStatus.ACTIVE },
      relations: ['user', 'role'],
      order: { createdAt: 'ASC' },
    });

    return groups.map((group) => ({
      ...group,
      members: memberships
        .filter((membership) => membership.groupId === group.id)
        .map((membership) => ({
          id: membership.userId,
          email: membership.user?.email,
          fullName: membership.user?.fullName,
          systemRole: membership.user?.systemRole,
          role: membership.role?.code,
        })),
    }));
  }

  async findAllUsers() {
    const users = await this.userRepository.find({
      order: { email: 'ASC' },
    });

    const memberships = await this.groupUserRepository.find({
      relations: ['group', 'role'],
      order: { createdAt: 'ASC' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      systemRole: user.systemRole,
      isActive: user.isActive,
      lastActiveGroupId: user.lastActiveGroupId,
      memberships: memberships
        .filter((membership) => membership.userId === user.id)
        .map((membership) => ({
          groupId: membership.groupId,
          groupName: membership.group?.name,
          status: membership.status,
          role: membership.role?.code,
        })),
    }));
  }

  async updateGroupStatus(id: string, status: GroupStatus) {
    await this.groupRepository.update(id, { status });
    return this.groupRepository.findOne({ where: { id } });
  }

  async updateGroup(id: string, data: { name?: string }) {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    const payload: Partial<Group> = {};
    if (data.name !== undefined) {
      payload.name = data.name;
    }

    await this.groupRepository.update(id, payload);
    return this.groupRepository.findOne({ where: { id } });
  }

  async updateGroupMemberRole(groupId: string, userId: string, roleCode: UserRole) {
    if (roleCode === UserRole.APP_ADMIN) {
      throw new ForbiddenException('APP_ADMIN là vai trò hệ thống, không phải vai trò trong nhóm');
    }

    const membership = await this.groupUserRepository.findOne({
      where: { groupId, userId, status: GroupUserStatus.ACTIVE },
      relations: ['user', 'role', 'group'],
    });

    if (!membership) {
      throw new NotFoundException('Không tìm thấy thành viên trong nhóm');
    }

    if (membership.role?.code === UserRole.GROUP_ADMIN && roleCode !== UserRole.GROUP_ADMIN) {
      await this.groupService.ensureGroupKeepsAdmin(groupId);
    }

    let role = await this.roleRepository.findOne({
      where: { code: roleCode },
    });

    if (!role) {
      role = await this.roleRepository.save(
        this.roleRepository.create({
          code: roleCode,
          name: roleCode,
          isTemplate: true,
        }),
      );
    }

    membership.roleId = role.id;
    membership.role = role;
    await this.groupUserRepository.save(membership);

    return {
      userId: membership.userId,
      groupId: membership.groupId,
      groupName: membership.group?.name,
      email: membership.user?.email,
      fullName: membership.user?.fullName,
      systemRole: membership.user?.systemRole,
      role: membership.role.code,
    };
  }

  async updateSystemRole(actorUserId: string, userId: string, systemRole: SystemRole) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.systemRole === SystemRole.APP_ADMIN && systemRole !== SystemRole.APP_ADMIN) {
      const appAdminCount = await this.userRepository.count({
        where: { systemRole: SystemRole.APP_ADMIN, isActive: true },
      });

      if (appAdminCount <= 1) {
        throw new ForbiddenException('Hệ thống phải có ít nhất 1 tài khoản Quản trị viên (APP_ADMIN)');
      }
    }

    user.systemRole = systemRole;
    await this.userRepository.save(user);

    return {
      actorUserId,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      systemRole: user.systemRole,
    };
  }

  async getSystemStats() {
    const [totalGroups, totalUsers, totalMemberships] = await Promise.all([
      this.groupRepository.count(),
      this.userRepository.count(),
      this.groupUserRepository.count({ where: { status: GroupUserStatus.ACTIVE } }),
    ]);
    return {
      totalGroups,
      totalUsers,
      totalMemberships,
    };
  }

  async createGroupByAdmin(name: string, adminUserId: string) {
    if (!adminUserId) {
      throw new BadRequestException('Phải chỉ định Quản trị viên khi tạo nhóm mới.');
    }

    const user = await this.userRepository.findOne({ where: { id: adminUserId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    let groupAdminRole = await this.roleRepository.findOne({
      where: { code: UserRole.GROUP_ADMIN },
    });
    if (!groupAdminRole) {
      groupAdminRole = await this.roleRepository.save(
        this.roleRepository.create({
          code: UserRole.GROUP_ADMIN,
          name: UserRole.GROUP_ADMIN,
          isTemplate: true,
        }),
      );
    }

    const group = await this.groupRepository.save(
      this.groupRepository.create({
        name: name.trim(),
        status: GroupStatus.ACTIVE,
      }),
    );

    await this.groupUserRepository.save(
      this.groupUserRepository.create({
        groupId: group.id,
        userId: user.id,
        roleId: groupAdminRole.id,
        status: GroupUserStatus.ACTIVE,
      }),
    );

    if (!user.lastActiveGroupId) {
      user.lastActiveGroupId = group.id;
      await this.userRepository.save(user);
    }

    return this.findAllGroups();
  }

  async addMemberToGroup(groupId: string, userId: string, roleCode: UserRole) {
    if (roleCode === UserRole.APP_ADMIN) {
      throw new ForbiddenException('APP_ADMIN là vai trò hệ thống, không phải vai trò trong nhóm');
    }

    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    let role = await this.roleRepository.findOne({ where: { code: roleCode } });
    if (!role) {
      role = await this.roleRepository.save(
        this.roleRepository.create({
          code: roleCode,
          name: roleCode,
          isTemplate: true,
        }),
      );
    }

    let membership = await this.groupUserRepository.findOne({
      where: { groupId, userId },
    });

    if (membership) {
      membership.roleId = role.id;
      membership.status = GroupUserStatus.ACTIVE;
      await this.groupUserRepository.save(membership);
    } else {
      membership = await this.groupUserRepository.save(
        this.groupUserRepository.create({
          groupId,
          userId,
          roleId: role.id,
          status: GroupUserStatus.ACTIVE,
        }),
      );
    }

    if (!user.lastActiveGroupId) {
      user.lastActiveGroupId = groupId;
      await this.userRepository.save(user);
    }

    return this.findAllGroups();
  }

  async removeMemberFromGroup(groupId: string, userId: string) {
    const membership = await this.groupUserRepository.findOne({
      where: { groupId, userId },
      relations: ['role'],
    });

    if (!membership) {
      throw new NotFoundException('Không tìm thấy thành viên trong nhóm');
    }

    await this.groupUserRepository.delete({ groupId, userId });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.lastActiveGroupId === groupId) {
      const remainingMembership = await this.groupUserRepository.findOne({
        where: { userId, status: GroupUserStatus.ACTIVE },
      });
      user.lastActiveGroupId = remainingMembership?.groupId ?? null;
      await this.userRepository.save(user);
    }

    return this.findAllGroups();
  }

  async deleteGroup(groupId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    const activeMembersCount = await this.groupUserRepository.count({
      where: { groupId, status: GroupUserStatus.ACTIVE },
    });

    if (activeMembersCount > 0) {
      throw new BadRequestException(
        'Không thể xóa nhóm đang có thành viên. Vui lòng gỡ hết thành viên trước khi xóa nhóm.',
      );
    }

    await this.groupRepository.manager.transaction(async (trx) => {
      await trx.query(`DELETE FROM sws_invites WHERE "groupId" = $1`, [groupId]).catch(() => {});
      await trx.query(`DELETE FROM sws_group_users WHERE "groupId" = $1`, [groupId]).catch(() => {});
      await trx.query(`DELETE FROM sws_samples WHERE "groupId" = $1`, [groupId]).catch(() => {});
      await trx.query(`DELETE FROM sws_categories WHERE "groupId" = $1`, [groupId]).catch(() => {});
      await trx.delete(Group, { id: groupId });
    });

    return this.findAllGroups();
  }
}
