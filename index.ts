import express, { Express } from "express";
import dotenv from "dotenv"
import bodyParser from "body-parser";
import cors from "cors"

import * as database from "./config/database"
import routesAdminVersion1 from "./api/v1/routes/admins/index.routes";
import routesClientVersion1 from "./api/v1/routes/clients/index.routes";
import routesEmployerVersion1 from "./api/v1/routes/employers/index.routes";
import routesLocations from "./api/v1/routes/locations/index.routes";
import { Server } from "socket.io";
import http from "http"

import routerSocketAll from "./socket/v1/routes/all/index-socket.routes";
import routesCommonVersion1 from "./api/v1/routes/common/index.routes";

const app: Express = express();

app.use(cors())

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST","DELETE","PUT","PATCH","OPTIONS"]
  }
});

routerSocketAll(io)

app.set('socketio', io);

app.use(bodyParser.json({ limit: '50mb' }))

dotenv.config()

database.connect();

routesCommonVersion1(app);

routesAdminVersion1(app);

routesClientVersion1(app);

routesEmployerVersion1(app);

routesLocations(app);

const port: (number | string) = process.env.PORT || 3001;

server.listen(port, (): void => {
    console.log(`App listening on port ${port}`)
})

