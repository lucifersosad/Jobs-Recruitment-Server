import { employerUserRoutes } from "./employer-user.routes";
import { Express } from "express";
import { jobCategoriesRoutes } from "./jobCategories.routes";
import { jobRoutes } from "./job.routes";
import * as authMiddlewares from "../../middlewares/employers/auth.middleware";
import { chatRoutes } from "./chat.routes";
import { cvRoutes } from "./cv.routes";
import { employerAuthRoutes } from "./auth.routes";
import { notificationRoutes } from "./notification.routes";
import { postRoutes } from "./post.routes";
import { myCvsRoutes } from "./my-cv.routes";

const routesEmployerVersion1 = (app: Express): void => {
    const version = "/api/v1/employer";
    app.use(version + "/auth", employerAuthRoutes);
    app.use(version + "/users", employerUserRoutes);
    app.use(version + "/job-categories", jobCategoriesRoutes);
    app.use(version + "/jobs", authMiddlewares.auth, jobRoutes);
    app.use(version + "/chat", authMiddlewares.auth, chatRoutes);
    app.use(version + "/cvs", authMiddlewares.auth, cvRoutes);
    app.use(version + "/notifications", authMiddlewares.auth, notificationRoutes);
    app.use(version + "/posts", authMiddlewares.auth, postRoutes);
    app.use(version + "/my-cvs", authMiddlewares.auth, myCvsRoutes);
};

export default routesEmployerVersion1;
