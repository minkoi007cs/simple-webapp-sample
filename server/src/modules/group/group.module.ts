import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { Group } from '../../common/entities/group.entity';
import { GroupUser } from '../../common/entities/group-user.entity';
import { User } from '../../common/entities/user.entity';
import { Role } from '../../common/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupUser, User, Role]),
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}

// Compatibility export
export { GroupModule as FamilyModule };
