
import { Express } from "express";
import { employerRoutes } from "./employer.routes";
import { jobRoutes } from "./job.routes";
import { jobCategoriesRoutes } from "./jobCategories.routes";
import { usersRoutes } from "./user-user.routes";
import * as authMiddlewares from "../../middlewares/clients/auth.middleware"
import { chatRoutes } from "./chat.routes";
import { cvRoutes } from "./cv.routes";
import { postRoutes } from "./post.routes";
import { myCvsRoutes } from "./my-cv.routes";
import { evaluationRoutes } from "./evaluation.routes";

const routesClientVersion1 = (app: Express): void => {
    const version = "/api/v1/client";
    app.use(version + "/employers", employerRoutes);
    app.use(version + "/users", usersRoutes);
    app.use(version +"/jobs",jobRoutes);
    app.use(version +"/job-categories",jobCategoriesRoutes)
    app.use(version +"/chat",authMiddlewares.auth,chatRoutes)
    app.use(version +"/cvs",authMiddlewares.auth,cvRoutes)
    app.use(version +"/post",authMiddlewares.auth,postRoutes)
    app.use(version +"/my-cvs", myCvsRoutes)
    app.use(version +"/ai-review",authMiddlewares.auth, evaluationRoutes)
}
export default routesClientVersion1