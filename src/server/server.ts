import { useExpressServer } from "routing-controllers";
import UserController from "./../controllers/userController";
import PreferenceController from "../controllers/preferenceController";
import helmet from "helmet";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import chalk from "chalk";

/**
 * The express app that'll represent the api server.
 */

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  morgan(function(tokens, req, res) {
    return [
      chalk.hex("#34ace0").bold(tokens.method(req, res)),
      chalk.hex("#ff5252").bold(tokens.url(req, res)),
      chalk.hex("#ffb142").bold(tokens.status(req, res)),
      chalk.hex("#2ed573").bold(tokens["response-time"](req, res) + " ms"),
      chalk.hex("#f78fb3").bold("@ " + tokens.date(req, res)),
      chalk.yellow(tokens["remote-addr"](req, res)),
      chalk.hex("#1e90ff")(tokens["user-agent"](req, res))
    ].join(" ");
  })
);

useExpressServer(app, {
  routePrefix: "/api",
  controllers: [UserController, PreferenceController]
});

export default app;
