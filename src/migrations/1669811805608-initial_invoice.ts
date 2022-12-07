import {MigrationInterface, QueryRunner} from "typeorm";

export class initialInvoice1669811805608 implements MigrationInterface {
    name = "initialInvoice1669811805608"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "invoice_status_enum" AS ENUM
            (
                'draft', 'sent', 'viewed', 'completed'
            );

            CREATE TYPE "invoice_paid_status_enum" AS ENUM
            (
                'unpaid', 'partially_paid', 'paid'
            );

            CREATE TABLE IF NOT EXISTS invoice
            (
                "id" character varying NOT NULL,
                "order_id" character varying NOT NULL,
                "number" character varying NOT NULL,
                "status" "invoice_status_enum" NOT NULL DEFAULT 'draft',
                "paid_status" "invoice_paid_status_enum" NOT NULL DEFAULT 'unpaid',
                "file_url" character varying NOT NULL,
                "notified_via_email_at" timestamp WITH time zone NULL,
                "overdue_notified_at" timestamp WITH time zone NULL,
                "overdue_at" timestamp WITH time zone NULL,
                "is_reverse_charge" boolean NOT NULL DEFAULT false,
                "is_intra_community" boolean NOT NULL DEFAULT false,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_invoice_id" PRIMARY KEY ("id")
            );

            CREATE TABLE IF NOT EXISTS invoice_cancellation
            (
                "id" character varying NOT NULL,
                "refund_id" character varying NOT NULL,
                "number" character varying NOT NULL,
                "file_url" character varying NOT NULL,
                "notified_via_email_at" timestamp WITH time zone NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                "metadata" jsonb NULL,
                CONSTRAINT "PK_invoice_cancellation_id" PRIMARY KEY ("id")
            );

            CREATE TABLE IF NOT EXISTS invoice_settings
            (
                "id" character varying NOT NULL,
                "option" character varying NOT NULL,
                "value" character varying NOT NULL,
                "created_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "updated_at" timestamp WITH time zone NOT NULL DEFAULT Now(),
                "deleted_at" timestamp WITH time zone NULL,
                CONSTRAINT "PK_invoice_settings_id" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_invoice_order_id" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_cancellation" ADD CONSTRAINT "FK_invoice_cancellation_refund_id" FOREIGN KEY ("refund_id") REFERENCES "refund"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_invoice_order_id"`);
        await queryRunner.query(`ALTER TABLE "invoice_cancellation" DROP CONSTRAINT "FK_invoice_cancellation_refund_id"`);
        await queryRunner.query(`
            DROP TABLE invoice;
            DROP TYPE "invoice_status_enum";
            DROP TYPE "invoice_paid_status_enum";
            DROP TABLE invoice_settings;
        `);
    }

}
