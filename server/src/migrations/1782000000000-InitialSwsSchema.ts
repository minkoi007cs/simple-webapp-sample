import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSwsSchema1782000000000 implements MigrationInterface {
  name = 'InitialSwsSchema1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Clean up any deprecated tables from earlier iterations
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_notifications" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_natural_input_history" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_gous_expenses" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_gous_tasks" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_gous_documents" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_gous_members" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_gous_cases" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_documents" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_calendar_event_participants" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_calendar_events" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_role_permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_permissions" CASCADE;`);

    // 1. Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_users_systemrole_enum" AS ENUM('USER', 'APP_ADMIN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_groups_status_enum" AS ENUM('ACTIVE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_roles_scope_enum" AS ENUM('SYSTEM', 'GROUP');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_group_users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'REMOVED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_invites_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_samples_status_enum" AS ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ARCHIVED', 'DISPOSED', 'ACTIVE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Core Tables
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "email" character varying NOT NULL UNIQUE,
        "fullName" character varying,
        "avatarUrl" character varying,
        "otherNames" text,
        "googleId" character varying,
        "systemRole" "public"."sws_users_systemrole_enum" NOT NULL DEFAULT 'USER',
        "lastActiveGroupId" uuid,
        "isActive" boolean NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" "public"."sws_groups_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "settings" jsonb
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL UNIQUE,
        "name" character varying NOT NULL,
        "scope" "public"."sws_roles_scope_enum" NOT NULL DEFAULT 'GROUP',
        "isTemplate" boolean NOT NULL DEFAULT true,
        "description" text
      );
    `);

    // Seed default role templates if not existing
    await queryRunner.query(`
      INSERT INTO "sws_roles" ("code", "name", "scope", "isTemplate")
      VALUES
        ('APP_ADMIN', 'APP_ADMIN', 'SYSTEM', true),
        ('GROUP_ADMIN', 'GROUP_ADMIN', 'GROUP', true),
        ('MEMBER', 'MEMBER', 'GROUP', true)
      ON CONFLICT ("code") DO NOTHING;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_group_users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "sws_users"("id") ON DELETE CASCADE,
        "roleId" uuid NOT NULL REFERENCES "sws_roles"("id") ON DELETE RESTRICT,
        "status" "public"."sws_group_users_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "invitedByUserId" uuid,
        CONSTRAINT "UQ_sws_group_users_group_user" UNIQUE ("groupId", "userId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_invites" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "token" character varying NOT NULL UNIQUE,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "roleId" uuid NOT NULL REFERENCES "sws_roles"("id"),
        "status" "public"."sws_invites_status_enum" NOT NULL DEFAULT 'PENDING',
        "expiresAt" TIMESTAMP NOT NULL,
        "invitedByUserId" uuid REFERENCES "sws_users"("id"),
        "acceptedByUserId" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "name" character varying NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "parentId" uuid REFERENCES "sws_categories"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_samples" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "name" character varying(255) NOT NULL,
        "code" character varying(100),
        "description" text,
        "type" character varying(100),
        "status" "public"."sws_samples_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "categoryId" uuid REFERENCES "sws_categories"("id") ON DELETE SET NULL,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "metadata" jsonb,
        "imageUrl" text,
        "createdByUserId" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_samples" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_categories" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_invites" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_group_users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_roles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_groups" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_users" CASCADE;`);
  }
}
