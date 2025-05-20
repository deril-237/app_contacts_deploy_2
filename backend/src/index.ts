import express from "express";
import { config } from "dotenv";
config();
import path from "path";
import { router } from "./routes";
import initDb from "./models";

async function main() {
  try {
    await initDb();
    const port = process.env.PORT || 3000;
    const app = express();
    app.use(express.json());
    app.use(express.static(path.resolve('public')))
    app.use(router);
    // app.use(multerConfigMiddleware.errorUpload())
    app.listen(port, () => {
      console.log('server started port 3000');
    });
  } catch (error) {
    console.log(error);
  }
}

main(); 