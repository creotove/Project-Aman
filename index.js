import dotenv from "dotenv";
import app from "./src/app.js";
dotenv.config();
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server Started on Port ${PORT} \n http://localhost:${PORT}`);
});
