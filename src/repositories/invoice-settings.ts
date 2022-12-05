import { EntityRepository, Repository } from "typeorm"
import { InvoiceSettings } from "../models/invoice-settings"

@EntityRepository(InvoiceSettings)
export class InvoiceSettingsRepository extends Repository<InvoiceSettings> {}