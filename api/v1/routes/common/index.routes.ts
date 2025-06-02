import { Express } from "express";
import { schoolRoutes } from "./school.routes";
import { skillRoutes } from "./skills.routes";
const routesCommonVersion1 = (app: Express) : void => {
    const version = "/api/v1/client";  
    app.use(version + "/schools", schoolRoutes);
    app.use(version + "/skills", skillRoutes);
}
export default routesCommonVersion1