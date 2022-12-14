import { Router } from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getConfigFile } from "medusa-core-utils";
import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate"

import email from "./email";

const route = Router()

export default (app, rootDirectory, config) => {
    app.use("/webhook/", route);

    const { configModule } = getConfigFile(rootDirectory, "medusa-config");
    const { projectConfig } = configModule;

    const corsOptions = {
        origin: projectConfig.admin_cors.split(","),
        credentials: true,
    };

    route.use(bodyParser.json());
    route.use(cors(corsOptions));
    //route.use(authenticate());

    email(route);

    return app;
}