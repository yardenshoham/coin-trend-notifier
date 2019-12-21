import express from "express";

/**
 * The express app that'll represent the api server.
 */
const app = express();

// add middleware/settings/routes to express.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
