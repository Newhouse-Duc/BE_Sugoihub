import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from '../src/config/connectdb.js';
import bodyParser from "body-parser";
import adminRouter from './routers/adminRoute.js';
import userRouter from "./routers/userRoute.js"
import cors from "cors";
import { createServer } from 'http';
import { initSocket } from './socket/socketio.js';
dotenv.config();

const port = process.env.PORT || 8888;
const app = express();
const httpServer = createServer(app);
const corsOptions = {
    origin: process.env.FRONT_END_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,

};
app.use(cors(corsOptions));


app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


connectDB();


app.use(express.json());


adminRouter(app)
userRouter(app)
initSocket(httpServer);


httpServer.listen(port, () => {
    console.log("back end node js is running " + port);
});

