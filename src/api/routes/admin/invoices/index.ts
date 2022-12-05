import { Router } from "express";
import { Invoice } from "../../../../models/invoice";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/invoices", route);

    route.get("/generate-pdf", middlewares.wrap(require("./generate-pdf").default));

    return app;
}

export const defaultAdminInvoiceRelations = []

export const defaultAdminInvoiceFields: (keyof Invoice)[] = [
    "id",
    "metadata",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./create-invoice";
export * from "./update-invoice";
export * from "./list-invoice";
export * from "./get-invoice";