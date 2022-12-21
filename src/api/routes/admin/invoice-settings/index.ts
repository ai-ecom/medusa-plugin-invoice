import { Router } from "express";
import { InvoiceSettings } from "../../../../models/invoice-settings";
import middlewares from "../../../middleware";
import "reflect-metadata"
import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate"

const route = Router()

export default (app) => {
    app.use("/invoice-settings", route);
    route.use(authenticate())

    route.get("/", middlewares.wrap(require("./all-invoice-settings").default));

    route.get("/:option", middlewares.wrap(require("./get-invoice-settings").default));

    route.put("/:option", middlewares.wrap(require("./set-invoice-settings").default));

    return app;
}

export const defaultAdminInvoiceSettingsRelations = []

export const defaultAdminInvoiceSettingsFields: (keyof InvoiceSettings)[] = [
    "id",
    "option",
    "value",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./all-invoice-settings";
export * from "./get-invoice-settings";
export * from "./set-invoice-settings";