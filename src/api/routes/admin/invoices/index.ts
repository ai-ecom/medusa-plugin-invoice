import { Router } from "express";
import { Invoice } from "../../../../models/invoice";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/invoices", route);

    route.post("/", middlewares.wrap(require("./create-invoice").default));

    route.get("/", middlewares.wrap(require("./list-invoice").default));

    route.get("/:id", middlewares.wrap(require("./get-invoice").default));

    route.put("/:id", middlewares.wrap(require("./update-invoice").default));

    return app;
}

export const defaultAdminInvoiceRelations = []

export const defaultAdminInvoiceFields: (keyof Invoice)[] = [
    "id",
    "order_id",
    "status",
    "paid_status",
    "metadata",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./create-invoice";
export * from "./update-invoice";
export * from "./list-invoice";
export * from "./get-invoice";