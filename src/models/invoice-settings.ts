import {
    BeforeInsert,
    Column,
    Entity,
    Index
} from "typeorm"

import { SoftDeletableEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";

@Entity()
export class InvoiceSettings extends SoftDeletableEntity {
    @Index({ unique: true, where: "deleted_at IS NULL" })
    @Column({ type: "varchar" })
    option: string
    
    @Column({ type: "varchar" })
    value: string

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "setg")
    }
}