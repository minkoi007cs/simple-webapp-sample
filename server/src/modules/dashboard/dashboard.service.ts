import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sample, SampleStatus } from '../../common/entities/sample.entity';
import { GroupUser, GroupUserStatus } from '../../common/entities/group-user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sample)
    private sampleRepository: Repository<Sample>,
    @InjectRepository(GroupUser)
    private groupUserRepository: Repository<GroupUser>,
  ) {}

  async getStats(
    groupId: string,
    _filters: { startDate?: string; endDate?: string; categoryId?: string } = {},
  ) {
    const [
      samples,
      sampleCount,
      activeSampleCount,
      membersCount,
    ] = await Promise.all([
      this.sampleRepository.find({
        where: { groupId },
        relations: ['category'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.sampleRepository.count({ where: { groupId } }),
      this.sampleRepository.count({ where: { groupId, status: SampleStatus.ACTIVE } }),
      this.groupUserRepository.count({ where: { groupId, status: GroupUserStatus.ACTIVE } }),
    ]);

    // Group samples by category
    const categoryMap = new Map<string, number>();
    for (const s of samples) {
      const catName = s.category?.name || 'Khác';
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
    }
    const samplesByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      value: count,
    }));

    return {
      totalSampleCount: sampleCount,
      totalAssetCount: sampleCount,
      activeSampleCount,
      groupMembersCount: membersCount,
      recentSamples: samples,
      samplesByCategory,
      assetsByCategory: samplesByCategory,
    };
  }
}
