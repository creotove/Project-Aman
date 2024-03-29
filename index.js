import dotenv from "dotenv";
dotenv.config();
import express from "express";
import adminRoutes from "./routes/admin.js";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
connectDB();
const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.use("/api/v1/admin", adminRoutes);
const html = `
<body bgColor='black' style='color:white;font-size:5rem;display:flex;justify-content:center; align-items:center;' >Api is Running...</body>
`;
app.get("/", (req, res) => {
  res.send(html);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server Started on Port ${PORT} \n http://localhost:${PORT}`);
});
