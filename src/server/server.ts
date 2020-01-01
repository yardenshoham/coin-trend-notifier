import { createExpressServer } from "routing-controllers";
import UserController from "./../controllers/userController";
import PreferenceController from "../controllers/preferenceController";

/**
 * The express app that'll represent the api server.
 */
const app = createExpressServer({
  routePrefix: "/api",
  controllers: [UserController, PreferenceController]
});
export default app;
