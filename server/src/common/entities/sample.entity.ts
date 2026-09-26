import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Group } from './group.entity';
import { Category } from './category.entity';

export enum SampleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  ARCHIVED = 'ARCHIVED',
  DISPOSED = 'DISPOSED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('sws_samples')
export class Sample extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, nullable: true })
  code?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, nullable: true })
  type?: string;

  @Index()
  @Column({
    type: 'enum',
    enum: SampleStatus,
    default: SampleStatus.AVAILABLE,
  })
  status: SampleStatus;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Index()
  @Column({ type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;
}
