import { Express } from "express";
import { schoolRoutes } from "./school.routes";
const routesCommonVersion1 = (app: Express) : void => {
    const version = "/api/v1/client";  
    app.use(version + "/schools", schoolRoutes);
}
export default routesCommonVersion1