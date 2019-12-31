import { createExpressServer } from "routing-controllers";
import express from "express";

/**
 * The express app that'll represent the api server.
 */
const app = createExpressServer({
  middlewares: [express.json(), express.urlencoded({ extended: true })]
});

export default app;
