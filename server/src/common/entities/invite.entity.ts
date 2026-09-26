import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Index } from 'typeorm';
import { Group } from './group.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('sws_invites')
@Index(['token'], { unique: true })
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  email: string;

  @Column()
  token: string;

  @Index()
  @Column({ type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, (group) => group.invites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  roleId: string;

  @ManyToOne(() => Role, (role) => role.invites)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status: InviteStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'uuid', nullable: true })
  invitedByUserId: string | null;

  @ManyToOne(() => User, (user) => user.invitesSent, { nullable: true })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedByUser: User | null;

  @Column({ type: 'uuid', nullable: true })
  acceptedByUserId: string | null;
}
