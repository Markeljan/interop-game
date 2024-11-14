import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { AuthController } from "./controllers/authController";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/challenge", AuthController.getChallenge);
app.post("/api/verify", AuthController.verifyChallenge);

app.use(express.static(path.join(__dirname, "../../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
