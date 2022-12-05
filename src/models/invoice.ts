import {
    BeforeInsert,
    Column,
    Entity,
    JoinColumn,
    OneToOne
} from "typeorm"

import { Order, SoftDeletableEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";
import { DbAwareColumn } from "@medusajs/medusa/dist/utils/db-aware-column";

export enum InvoiceStatus {
    DRAFT = "draft",
    SENT = "sent",
    VIEWED = "viewed",
    COMPLETED = "completed"
}

export enum InvoicePaidStatus {
    UNPAID = "unpaid",
    PARTIALLY_PAID = "partially_paid",
    PAID = "paid"
}

@Entity()
export class Invoice extends SoftDeletableEntity {
    @Column({ type: "varchar", nullable: true })
    order_id: string | null

    @OneToOne(() => Order, (o) => o.id)
    @JoinColumn({ name: "order_id" })
    order: Order | null
  
    @Column({ type: "varchar", nullable: false })
    number: string | null

    @DbAwareColumn({ type: "enum", enum: InvoiceStatus, default: "draft" })
    status: InvoiceStatus

    @DbAwareColumn({ type: "enum", enum: InvoicePaidStatus, default: "unpaid" })
    paid_status: InvoicePaidStatus

    @Column({ type: "varchar", nullable: false })
    file_url: string

    @Column({ type: "timestamp with time zone", nullable: true })
    notified_via_email_at: Date | null
  
    @Column({ type: "timestamp with time zone", nullable: true })
    overdue_notified_at: Date | null

    @Column({ type: "timestamp with time zone", nullable: true })
    overdue_at: Date | null

    @Column({ default: false })
    is_reverse_charge: boolean

    @Column({ default: false })
    is_intra_community: boolean

    @DbAwareColumn({ type: "jsonb", nullable: true })
    metadata: Record<string, unknown> | null

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "invo")
    }
}