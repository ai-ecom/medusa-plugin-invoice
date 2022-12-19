import { Router } from "express";
import "reflect-metadata"
import { InvoiceCancellation } from "../../../../models/invoice-cancellation";
import middlewares from "@medusajs/medusa/dist/api/middlewares"
import { transformQuery } from "../../../middleware/custom-query"
import { AdminGetInvoiceCancellationsParams } from "./list-invoice-cancellation";

const route = Router()

export default (app) => {
    app.use("/invoice-cancellations", route);

    route.post("/", middlewares.wrap(require("./create-invoice-cancellation").default));

    route.get(
        "/",
        transformQuery(AdminGetInvoiceCancellationsParams, {
            defaultRelations: defaultAdminInvoiceCancellationRelations,
            defaultFields: defaultAdminInvoiceCancellationFields,
            allowedFields: allowedAdminInvoiceCancellationFields,
            isList: true,
        }),
        middlewares.wrap(require("./list-invoice-cancellation").default)
    )

    route.get("/:id", middlewares.wrap(require("./get-invoice-cancellation").default));

    route.get("/:id/view", middlewares.wrap(require("./view-invoice-cancellation").default));

    route.post("/:id/resend", middlewares.wrap(require("./resend-invoice-cancellation").default));

    return app;
}

export const defaultAdminInvoiceCancellationRelations = [
    "refund"
]

export const defaultAdminInvoiceCancellationFields: (keyof InvoiceCancellation)[] = [
    "id",
    "refund_id",
    "refund",
    "number",
    "notified_via_email_at",
    "metadata",
    "created_at",
    "updated_at",
    "deleted_at",
]

export const allowedAdminInvoiceCancellationFields = [
    "id",
    "refund_id",
    "refund",
    "number",
    "notified_via_email_at",
    "metadata",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./create-invoice-cancellation";
export * from "./list-invoice-cancellation";
export * from "./get-invoice-cancellation";
export * from "./view-invoice-cancellation";
export * from "./resend-invoice-cancellation";