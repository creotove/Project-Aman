import express from "express";
import {fileURLToPath} from "url";
import {dirname} from "path";
import fs from "fs";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import {defaultGetRouteResponseHTML} from "./constants/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
connectDB();
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [process.env.DEVLOPMENT_URL, process.env.PRODUCTION_URL],
    credentials: true,
  })
);
app.use(
  cookieParser({
    httpOnly: true,
    secure: true,
    sameSite: "none",
  })
);
app.use(compression());
const routeFiles = fs.readdirSync(__dirname + "/routes/").filter((file) => file.endsWith(".js"));
const adminRouteFiles = fs.readdirSync(__dirname + "/routes/admin").filter((file) => file.endsWith(".js"));
for (const file of routeFiles) {
  const route = await import(`./routes/${file}`);
  const routeName = Object.keys(route)[0];
  app.use("/api/v1", route[routeName]);
}
for (const file of adminRouteFiles) {
  const route = await import(`./routes/admin/${file}`);
  const routeName = Object.keys(route)[0];
  app.use("/api/v1/admin", route[routeName]);
}
app.get("/", (req, res) => {
  res.send(defaultGetRouteResponseHTML);
});
// global error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    success: false,
    message: err.message,
  });
});

export default app;
