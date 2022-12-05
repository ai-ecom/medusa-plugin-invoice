import { Router } from "express";
import admin from "./routes/admin";
import errorHandler from "./middleware/error-handler"

export default (rootDirectory, options) => {
    const app = Router();

    admin(app, rootDirectory, options);

    app.use(errorHandler())

    return app;
};