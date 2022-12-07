import {
    BeforeInsert,
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne
} from "typeorm"

import { Refund, Return, SoftDeletableEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";


@Entity()
export class InvoiceCancellation extends SoftDeletableEntity {
    @Column({ type: "varchar", nullable: false })
    number: string | null

    @Column({ type: "varchar", nullable: false })
    file_url: string

    @Column({ type: "timestamp with time zone", nullable: true })
    notified_via_email_at: Date | null

    @Column({ type: "varchar", nullable: true })
    refund_id: string | null

    @OneToOne(() => Refund)
    @JoinColumn({ name: "refund_id" })
    refund: Refund

    @DbAwareColumn({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown> | null

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "invc")
    }
}