import { EntityRepository, Repository } from "typeorm"
import { InvoiceCancellation } from "../models/invoice-cancellation"

@EntityRepository(InvoiceCancellation)
export class InvoiceCancellationRepository extends Repository<InvoiceCancellation> {}