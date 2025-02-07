
import  { Express } from "express";
import { employerRoutes } from "./employer.routes";
import { jobRoutes } from "./job.routes";
import { jobCategoriesRoutes } from "./jobCategories.routes";
import { uploadRoutes } from "./upload.routes";
import { adminRoutes } from "./admins-user.routes";
import { roleRoutes } from "./roles.routes";
import { oauthRoutes } from "./oauth.routes";
import { seedRoutes } from "./seed.routes";
import * as middleware from "../../middlewares/admins/auth.middleware"
const routesAdminVersion1 = (app : Express) : void => {
    const version = "/api/v1/admin";
    app.use(version +"/employers",employerRoutes);
    app.use(version +"/jobs",middleware.auth,jobRoutes);
    app.use(version +"/job-categories",middleware.auth,jobCategoriesRoutes)
    app.use(version +"/admins",adminRoutes)
    app.use(version +"/uploads",uploadRoutes);
    app.use(version +"/roles",middleware.auth,roleRoutes);
    app.use('/oauth', oauthRoutes);
    app.use(version + '/seeder', seedRoutes);
    
}
export default routesAdminVersion1