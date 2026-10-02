CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text,
	"actor_label" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_audit_log_details_size" CHECK (octet_length("admin_audit_log"."details"::text) <= 4096)
);
--> statement-breakpoint
CREATE TABLE "admin_operator" (
	"user_id" text PRIMARY KEY NOT NULL,
	"granted_by" text NOT NULL,
	"note" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_operator_note_length" CHECK (char_length("admin_operator"."note") <= 200)
);
--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "auth_rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email"),
	CONSTRAINT "auth_user_email_lowercase" CHECK ("auth_user"."email" = lower("auth_user"."email"))
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"status_note" text,
	"current_content_version" text NOT NULL,
	"unlocks_after" text,
	"unlock_needs" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_lesson_id_format" CHECK ("curriculum_lesson"."id" ~ '^L[0-9]{2}$'),
	CONSTRAINT "curriculum_lesson_status_value" CHECK ("curriculum_lesson"."status" in ('available', 'paused')),
	CONSTRAINT "curriculum_lesson_position_range" CHECK ("curriculum_lesson"."position" between 0 and 999),
	CONSTRAINT "curriculum_lesson_status_note_length" CHECK (char_length("curriculum_lesson"."status_note") <= 200)
);
--> statement-breakpoint
CREATE TABLE "curriculum_lesson_version" (
	"lesson_id" text NOT NULL,
	"content_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retired_at" timestamp with time zone,
	CONSTRAINT "curriculum_lesson_version_lesson_id_content_version_pk" PRIMARY KEY("lesson_id","content_version"),
	CONSTRAINT "curriculum_lesson_version_format" CHECK ("curriculum_lesson_version"."content_version" ~ '^[a-z0-9][a-z0-9.-]{0,39}$')
);
--> statement-breakpoint
CREATE TABLE "curriculum_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_unit_id_format" CHECK ("curriculum_unit"."id" ~ '^[a-z][a-z0-9-]{1,40}$'),
	CONSTRAINT "curriculum_unit_position_range" CHECK ("curriculum_unit"."position" between 0 and 999)
);
--> statement-breakpoint
CREATE TABLE "child_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"nickname" text NOT NULL,
	"avatar" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_profile_nickname_length" CHECK (char_length("child_profile"."nickname") between 1 and 24),
	CONSTRAINT "child_profile_avatar_preset" CHECK ("child_profile"."avatar" is null or "child_profile"."avatar" in ('sun', 'berry', 'ember', 'sky', 'leaf', 'plum'))
);
--> statement-breakpoint
CREATE TABLE "family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_owner_user_id_unique" UNIQUE("owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "app_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "database_environment" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"environment" text NOT NULL,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "database_environment_singleton" CHECK ("database_environment"."singleton"),
	CONSTRAINT "database_environment_value" CHECK ("database_environment"."environment" in ('production', 'development'))
);
--> statement-breakpoint
CREATE TABLE "dev_email_capture" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_address" text NOT NULL,
	"subject" text NOT NULL,
	"text_body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_sync_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"child_id" uuid,
	"lesson_id" text,
	"client_attempt_id" text,
	"outcome" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_sync_event_outcome_value" CHECK ("progress_sync_event"."outcome" in ('rejected', 'conflict', 'imported')),
	CONSTRAINT "progress_sync_event_reason_length" CHECK (char_length("progress_sync_event"."reason") <= 80)
);
--> statement-breakpoint
CREATE TABLE "lesson_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_attempt_id" text NOT NULL,
	"child_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"content_version" text NOT NULL,
	"source" text NOT NULL,
	"revision" integer NOT NULL,
	"phase" text NOT NULL,
	"furthest_phase" text NOT NULL,
	"evidence_state" text,
	"input_mode" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"first_completed_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone NOT NULL,
	"details" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_attempt_client_attempt_id_unique" UNIQUE("client_attempt_id"),
	CONSTRAINT "lesson_attempt_client_id_format" CHECK ("lesson_attempt"."client_attempt_id" ~ '^[A-Za-z0-9-]{8,64}$'),
	CONSTRAINT "lesson_attempt_source_value" CHECK ("lesson_attempt"."source" in ('live', 'import')),
	CONSTRAINT "lesson_attempt_revision_range" CHECK ("lesson_attempt"."revision" between 1 and 100000),
	CONSTRAINT "lesson_attempt_phase_value" CHECK ("lesson_attempt"."phase" in ('explanation', 'demo', 'guided', 'independent', 'transfer', 'remediation', 'review', 'result')),
	CONSTRAINT "lesson_attempt_furthest_phase_value" CHECK ("lesson_attempt"."furthest_phase" in ('explanation', 'demo', 'guided', 'independent', 'transfer', 'remediation', 'review', 'result')),
	CONSTRAINT "lesson_attempt_evidence_value" CHECK ("lesson_attempt"."evidence_state" is null or "lesson_attempt"."evidence_state" in ('explored', 'practiced', 'independent', 'retained')),
	CONSTRAINT "lesson_attempt_input_value" CHECK ("lesson_attempt"."input_mode" in ('touch', 'computer-keys', 'midi', 'mixed')),
	CONSTRAINT "lesson_attempt_mastery_needs_completion" CHECK ("lesson_attempt"."evidence_state" is null or "lesson_attempt"."evidence_state" not in ('independent', 'retained') or "lesson_attempt"."completed_at" is not null),
	CONSTRAINT "lesson_attempt_first_completion_consistent" CHECK (("lesson_attempt"."first_completed_at" is null) = ("lesson_attempt"."completed_at" is null)),
	CONSTRAINT "lesson_attempt_details_size" CHECK (octet_length("lesson_attempt"."details"::text) <= 2048)
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"child_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"evidence_state" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"completed_attempt_count" integer DEFAULT 0 NOT NULL,
	"imported_attempt_count" integer DEFAULT 0 NOT NULL,
	"first_started_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone,
	"first_completed_at" timestamp with time zone,
	"explored_at" timestamp with time zone,
	"practiced_at" timestamp with time zone,
	"independent_at" timestamp with time zone,
	"retained_at" timestamp with time zone,
	"last_input_mode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_child_id_lesson_id_pk" PRIMARY KEY("child_id","lesson_id"),
	CONSTRAINT "lesson_progress_evidence_value" CHECK ("lesson_progress"."evidence_state" is null or "lesson_progress"."evidence_state" in ('explored', 'practiced', 'independent', 'retained')),
	CONSTRAINT "lesson_progress_counts_valid" CHECK ("lesson_progress"."attempt_count" >= "lesson_progress"."completed_attempt_count" and "lesson_progress"."completed_attempt_count" >= 0 and "lesson_progress"."imported_attempt_count" between 0 and "lesson_progress"."attempt_count")
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_user_id_auth_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."auth_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_operator" ADD CONSTRAINT "admin_operator_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_lesson" ADD CONSTRAINT "curriculum_lesson_unit_id_curriculum_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."curriculum_unit"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_lesson_version" ADD CONSTRAINT "curriculum_lesson_version_lesson_id_curriculum_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."curriculum_lesson"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_profile" ADD CONSTRAINT "child_profile_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family" ADD CONSTRAINT "family_owner_user_id_auth_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_sync_event" ADD CONSTRAINT "progress_sync_event_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_sync_event" ADD CONSTRAINT "progress_sync_event_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_lesson_version_fk" FOREIGN KEY ("lesson_id","content_version") REFERENCES "public"."curriculum_lesson_version"("lesson_id","content_version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_child_id_child_profile_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_curriculum_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."curriculum_lesson"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_log_target_idx" ON "admin_audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "auth_account_user_id_idx" ON "auth_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_provider_account_uidx" ON "auth_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "auth_session_user_id_idx" ON "auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "curriculum_lesson_unit_idx" ON "curriculum_lesson" USING btree ("unit_id","position");--> statement-breakpoint
CREATE INDEX "child_profile_family_idx" ON "child_profile" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "child_profile_family_nickname_uidx" ON "child_profile" USING btree ("family_id",lower("nickname"));--> statement-breakpoint
CREATE INDEX "dev_email_capture_to_idx" ON "dev_email_capture" USING btree ("to_address","created_at");--> statement-breakpoint
CREATE INDEX "progress_sync_event_created_idx" ON "progress_sync_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "progress_sync_event_lesson_idx" ON "progress_sync_event" USING btree ("lesson_id","created_at");--> statement-breakpoint
CREATE INDEX "lesson_attempt_child_lesson_idx" ON "lesson_attempt" USING btree ("child_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_attempt_child_activity_idx" ON "lesson_attempt" USING btree ("child_id","last_activity_at");--> statement-breakpoint
CREATE INDEX "lesson_attempt_lesson_started_idx" ON "lesson_attempt" USING btree ("lesson_id","started_at");