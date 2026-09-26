import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSwsSchema1782000000000 implements MigrationInterface {
  name = 'InitialSwsSchema1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

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
        CREATE TYPE "public"."sws_permissions_modulekey_enum" AS ENUM(
          'ADMIN', 'GROUP', 'USER', 'PERMISSION', 'DASHBOARD',
          'CATEGORY', 'CALENDAR', 'SAMPLE', 'DOCUMENT', 'GOUS'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_permissions_action_enum" AS ENUM('view', 'create', 'update', 'delete');
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
        CREATE TYPE "public"."sws_samples_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_calendar_events_type_enum" AS ENUM('EVENT', 'REMINDER', 'SAMPLE_REVIEW', 'MEETING');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_documents_status_enum" AS ENUM('PROCESSING', 'READY', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_cases_currentstage_enum" AS ENUM(
          'NVC_CASE_CREATION', 'DS260_CIVIL_DOCS', 'DOCUMENTARILY_QUALIFIED',
          'INTERVIEW_READY', 'INTERVIEW_COMPLETED', 'POST_INTERVIEW_DEPARTURE'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_members_roleincase_enum" AS ENUM('PRINCIPAL_APPLICANT', 'SPOUSE', 'CHILD');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_members_ds260status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_members_policecertstatus_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_members_medicalstatus_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_members_visastatus_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_documents_category_enum" AS ENUM(
          'PETITIONER_CIVIL', 'FINANCIAL_SUPPORT', 'CIVIL_IDENTITY', 'POLICE_CERTIFICATE',
          'PASSPORT_PHOTO', 'TRANSLATION_AFFIDAVIT', 'DS260_CONFIRMATION', 'MEDICAL_EXAM', 'INTERVIEW_LETTER'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_documents_status_enum" AS ENUM(
          'NOT_PREPARED', 'COLLECTING', 'READY_FOR_SUBMISSION', 'SUBMITTED_CEAC', 'ACCEPTED_NVC', 'REJECTED_NEED_REPLACE'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_tasks_stage_enum" AS ENUM(
          'NVC_CASE_CREATION', 'DS260_CIVIL_DOCS', 'DOCUMENTARILY_QUALIFIED',
          'INTERVIEW_READY', 'INTERVIEW_COMPLETED', 'POST_INTERVIEW_DEPARTURE'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_tasks_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_expenses_category_enum" AS ENUM(
          'NVC_GOVERNMENT_FEE', 'DS260_PROCESSING_FEE', 'CIVIL_DOCS_TRANSLATION_NOTARY',
          'CRIMINAL_RECORD_LLTP2', 'MEDICAL_EXAMINATION', 'VACCINATION',
          'USCIS_IMMIGRANT_FEE', 'FLIGHT_TICKET', 'INITIAL_SETTLEMENT_FUNDS'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."sws_gous_expenses_status_enum" AS ENUM('ESTIMATED', 'PENDING_PAYMENT', 'PAID', 'OVERDUE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Tables
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

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_permissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "moduleKey" "public"."sws_permissions_modulekey_enum" NOT NULL,
        "action" "public"."sws_permissions_action_enum" NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "UQ_sws_permissions_module_action" UNIQUE ("moduleKey", "action")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "roleId" uuid NOT NULL REFERENCES "sws_roles"("id") ON DELETE CASCADE,
        "permissionId" uuid NOT NULL REFERENCES "sws_permissions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_sws_role_permissions_role_perm" UNIQUE ("roleId", "permissionId")
      );
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
        "status" "public"."sws_samples_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "categoryId" uuid REFERENCES "sws_categories"("id") ON DELETE SET NULL,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "metadata" jsonb,
        "imageUrl" text,
        "createdByUserId" uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_calendar_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "title" character varying NOT NULL,
        "description" text,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "isFullDay" boolean NOT NULL DEFAULT false,
        "location" character varying,
        "reminderMinutes" integer NOT NULL DEFAULT 0,
        "type" "public"."sws_calendar_events_type_enum" NOT NULL DEFAULT 'EVENT',
        "metadata" character varying,
        "recurrenceRule" character varying,
        "createdBy" character varying NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_calendar_event_participants" (
        "calendarEventId" uuid NOT NULL REFERENCES "sws_calendar_events"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "sws_users"("id") ON DELETE CASCADE,
        CONSTRAINT "PK_sws_calendar_event_participants" PRIMARY KEY ("calendarEventId", "userId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "sampleId" uuid REFERENCES "sws_samples"("id") ON DELETE SET NULL,
        "uploadedByUserId" uuid REFERENCES "sws_users"("id") ON DELETE SET NULL,
        "title" character varying NOT NULL,
        "originalFileName" character varying,
        "fileUrl" character varying NOT NULL,
        "thumbnailUrl" character varying,
        "mimeType" character varying NOT NULL DEFAULT 'application/octet-stream',
        "fileSize" bigint NOT NULL DEFAULT 0,
        "category" character varying NOT NULL DEFAULT 'Chung',
        "tags" jsonb NOT NULL DEFAULT '[]',
        "summary" text,
        "extractedContent" text,
        "structuredData" jsonb,
        "status" "public"."sws_documents_status_enum" NOT NULL DEFAULT 'READY',
        "errorMessage" text,
        "userNote" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_gous_cases" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "groupId" uuid NOT NULL UNIQUE REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "visaCategory" character varying NOT NULL DEFAULT 'F4 - Anh/Chị/Em công dân Mỹ',
        "caseNumber" character varying,
        "invoiceId" character varying,
        "priorityDate" date,
        "approvalDate" date,
        "currentStage" "public"."sws_gous_cases_currentstage_enum" NOT NULL DEFAULT 'NVC_CASE_CREATION',
        "receiptNumber" character varying,
        "petitionerName" character varying,
        "petitionerRelationship" character varying,
        "petitionerAddress" character varying,
        "petitionerPhone" character varying,
        "petitionerEmail" character varying,
        "principalApplicantName" character varying,
        "jointSponsorInfo" text,
        "interviewDate" TIMESTAMP,
        "interviewLocation" character varying DEFAULT 'Tổng Lãnh sự quán Hoa Kỳ tại TP.HCM (4 Lê Duẩn, Q.1)',
        "medicalExamDate" date,
        "vaccinationDate" date,
        "intendedDepartureDate" date,
        "portOfEntry" character varying,
        "destinationAddress" character varying,
        "notes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_gous_members" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "caseId" uuid NOT NULL REFERENCES "sws_gous_cases"("id") ON DELETE CASCADE,
        "fullName" character varying NOT NULL,
        "roleInCase" "public"."sws_gous_members_roleincase_enum" NOT NULL DEFAULT 'CHILD',
        "dob" date,
        "gender" character varying,
        "passportNumber" character varying,
        "passportExpiry" date,
        "ds260ConfirmationNumber" character varying,
        "ds260Status" "public"."sws_gous_members_ds260status_enum" NOT NULL DEFAULT 'NOT_STARTED',
        "policeCertStatus" "public"."sws_gous_members_policecertstatus_enum" NOT NULL DEFAULT 'NOT_STARTED',
        "policeCertIssueDate" date,
        "medicalStatus" "public"."sws_gous_members_medicalstatus_enum" NOT NULL DEFAULT 'NOT_STARTED',
        "visaStatus" "public"."sws_gous_members_visastatus_enum" NOT NULL DEFAULT 'NOT_STARTED',
        "uscisFeePaid" boolean NOT NULL DEFAULT false,
        "cspaAge" numeric(5,2),
        "cspaStatus" character varying,
        "notes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_gous_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "caseId" uuid NOT NULL REFERENCES "sws_gous_cases"("id") ON DELETE CASCADE,
        "memberId" uuid REFERENCES "sws_gous_members"("id") ON DELETE SET NULL,
        "category" "public"."sws_gous_documents_category_enum" NOT NULL DEFAULT 'CIVIL_IDENTITY',
        "title" character varying NOT NULL,
        "description" text,
        "isRequired" boolean NOT NULL DEFAULT true,
        "status" "public"."sws_gous_documents_status_enum" NOT NULL DEFAULT 'NOT_PREPARED',
        "issueDate" date,
        "expiryDate" date,
        "fileUrl" character varying,
        "fileUrls" json,
        "expertNotes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_gous_tasks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "caseId" uuid NOT NULL REFERENCES "sws_gous_cases"("id") ON DELETE CASCADE,
        "stage" "public"."sws_gous_tasks_stage_enum" NOT NULL DEFAULT 'NVC_CASE_CREATION',
        "title" character varying NOT NULL,
        "description" text,
        "priority" "public"."sws_gous_tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "status" "public"."sws_gous_tasks_status_enum" NOT NULL DEFAULT 'TODO',
        "dueDate" date,
        "assignedTo" character varying,
        "isSystemSuggested" boolean NOT NULL DEFAULT false,
        "expertTips" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_gous_expenses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "caseId" uuid NOT NULL REFERENCES "sws_gous_cases"("id") ON DELETE CASCADE,
        "category" "public"."sws_gous_expenses_category_enum" NOT NULL DEFAULT 'NVC_GOVERNMENT_FEE',
        "title" character varying NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'USD',
        "estimatedAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "actualAmount" numeric(12,2),
        "status" "public"."sws_gous_expenses_status_enum" NOT NULL DEFAULT 'ESTIMATED',
        "payer" character varying,
        "paidDate" date,
        "notes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_natural_input_history" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "groupId" uuid NOT NULL REFERENCES "sws_groups"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "sws_users"("id") ON DELETE CASCADE,
        "inputMessage" text NOT NULL,
        "intent" character varying,
        "confidence" double precision,
        "resultData" jsonb
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sws_notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        "deletedAt" TIMESTAMP,
        "familyId" character varying NOT NULL,
        "userId" uuid NOT NULL REFERENCES "sws_users"("id") ON DELETE CASCADE,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "metadata" json,
        "scheduledAt" TIMESTAMP
      );
    `);

    // 3. Indices
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sws_documents_groupId" ON "sws_documents" ("groupId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sws_documents_category" ON "sws_documents" ("category");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sws_notifications_family_user" ON "sws_notifications" ("familyId", "userId");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_samples" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_categories" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_invites" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_group_users" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_role_permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_roles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_groups" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sws_users" CASCADE;`);
  }
}
