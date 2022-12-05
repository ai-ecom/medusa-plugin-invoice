import { EntityRepository, Repository } from "typeorm"
import { Invoice } from "../models/invoice"

@EntityRepository(Invoice)
export class InvoiceRepository extends Repository<Invoice> {}