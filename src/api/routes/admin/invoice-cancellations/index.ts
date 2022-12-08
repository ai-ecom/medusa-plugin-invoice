import { Router } from "express";
import { InvoiceCancellation } from "../../../../models/invoice-cancellation";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/invoice-cancellations", route);

    route.post("/", middlewares.wrap(require("./create-invoice-cancellation").default));

    route.get("/", middlewares.wrap(require("./list-invoice-cancellation").default));

    route.get("/:id", middlewares.wrap(require("./get-invoice-cancellation").default));

    return app;
}

export const defaultAdminInvoiceRelations = []

export const defaultAdminInvoiceFields: (keyof InvoiceCancellation)[] = [
    "id",
    "refund_id",
    "metadata",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./create-invoice-cancellation";
export * from "./list-invoice-cancellation";
export * from "./get-invoice-cancellation";