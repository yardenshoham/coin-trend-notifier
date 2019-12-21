import express from "express";

// init express
const app = express();

// add middleware/settings/routes to express.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
