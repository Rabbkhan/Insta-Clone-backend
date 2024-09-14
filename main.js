import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
// import mongoose from "mongoose";
import userRoute from  "./routes/user.route.js";

dotenv.config({});
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (_, res) => {
    return res.status(200).json({
        message: "I AM Coming From A Backend",
        success: true
    })
})

app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));

const corsOption = {
    origin: 'http://localhost:5173',
    Credentials: true
}
app.use(cors(corsOption));

// Routes 

app.get("/api/v1/user", userRoute);
// "http://localhost:8000/api/v1/user/register"


// ?Start the Server
app.listen(PORT, () => {
    connectDB(),
        console.log(`Server Listen at PORT ${PORT}`); 
})
