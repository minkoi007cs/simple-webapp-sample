import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Sample } from '../../common/entities/sample.entity';
import { GroupUser } from '../../common/entities/group-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sample, GroupUser]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
