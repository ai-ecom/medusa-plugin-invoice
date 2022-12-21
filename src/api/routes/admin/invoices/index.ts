import { Router } from "express";
import "reflect-metadata"
import { Invoice } from "../../../../models/invoice";
import middlewares from "@medusajs/medusa/dist/api/middlewares"
import { transformQuery } from "../../../middleware/custom-query"
import { AdminGetInvoicesParams } from "./list-invoice";
import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate"

const route = Router()

export default (app) => {
    app.use("/invoices", route);
    route.use(authenticate())
    
    route.post("/", middlewares.wrap(require("./create-invoice").default));

    route.get(
        "/",
        transformQuery(AdminGetInvoicesParams, {
            defaultRelations: defaultAdminInvoiceRelations,
            defaultFields: defaultAdminInvoiceFields,
            allowedFields: allowedAdminInvoiceFields,
            isList: true,
        }),
        middlewares.wrap(require("./list-invoice").default)
    )

    route.get("/:id", middlewares.wrap(require("./get-invoice").default));

    route.get("/:id/view", middlewares.wrap(require("./view-invoice").default));

    route.post("/:id/resend", middlewares.wrap(require("./resend-invoice").default));

    route.put("/:id", middlewares.wrap(require("./update-invoice").default));

    return app;
}

export const defaultAdminInvoiceRelations = [
    "order"
]

export const defaultAdminInvoiceFields: (keyof Invoice)[] = [
    "id",
    "status",
    "paid_status",
    "order",
    "order_id",
    "number",
    "overdue_at",
    "notified_via_email_at",
    "overdue_notified_at",
    "created_at",
    "updated_at",
    "deleted_at",
    "metadata",
]

export const allowedAdminInvoiceFields = [
    "id",
    "status",
    "order",
    "order_id",
    "number",
    "overdue_at",
    "notified_via_email_at",
    "overdue_notified_at",
    "created_at",
    "updated_at",
    "deleted_at",
    "metadata",
  ]

export * from "./create-invoice";
export * from "./update-invoice";
export * from "./list-invoice";
export * from "./get-invoice";
export * from "./view-invoice";
export * from "./resend-invoice";