import { Router } from "express";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/email", route);

    route.post("/", middlewares.wrap(require("./send-event-email").default));

    return app;
}

export * from "./send-event-email";