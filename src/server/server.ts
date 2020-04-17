import { useExpressServer, getMetadataArgsStorage } from "routing-controllers";
import { routingControllersToSpec } from "routing-controllers-openapi";
import UserController from "./../controllers/userController";
import PreferenceController from "../controllers/preferenceController";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import chalk from "chalk";
import { Response } from "express";
import { OK } from "http-status-codes";
import EventController from "./../controllers/eventController";
import fs from "fs-extra";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";
import { getFromContainer, MetadataStorage } from "class-validator";

/**
 * The express app that'll represent the api server.
 */
const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());

app.use(
  morgan(
    /* istanbul ignore next */
    (tokens, req, res) => {
      return [
        chalk.hex("#34ace0").bold(tokens.method(req, res)),
        chalk.hex("#ff5252").bold(tokens.url(req, res)),
        chalk.hex("#ffb142").bold(tokens.status(req, res)),
        chalk.hex("#2ed573").bold(tokens["response-time"](req, res) + " ms"),
        chalk.hex("#f78fb3").bold("@ " + tokens.date(req, res)),
        chalk.yellow(tokens["remote-addr"](req, res)),
        chalk.hex("#1e90ff")(tokens["user-agent"](req, res)),
      ].join(" ");
    },
    {
      skip: (req) => req.headers["user-agent"]?.includes("node-superagent"),
    }
  )
);

app.get("/", (_, res: Response) => {
  return res.status(OK).send("🔥 Coin Trend Notifier API is Live! 🔥");
});

useExpressServer(app, {
  development: false,
  routePrefix: "/api",
  controllers: [UserController, PreferenceController, EventController],
});

// parse class-validator classes into JSON Schema
const metadatas = (getFromContainer(MetadataStorage) as any)
  .validationMetadatas;
const schemas = validationMetadatasToSchemas(metadatas, {
  refPointerPrefix: "#/components/schemas/",
});

// parse routing-controllers classes into OpenAPI spec
const storage = getMetadataArgsStorage();
const spec = routingControllersToSpec(
  storage,
  {},
  {
    servers: [{ url: "https://coin-trend-notifier-api.herokuapp.com/api" }],
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          scheme: "bearer",
          type: "http",
          bearerFormat: "JWT",
        },
      },
    },
    info: {
      title: "Coin Trend Notifier API",
      version: "1.0.0",
    },
  }
);

fs.outputFile("docs/spec.json", JSON.stringify(spec));

export default app;
