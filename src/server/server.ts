import { createExpressServer } from "routing-controllers";
import UserController from "./../controllers/userController";

/**
 * The express app that'll represent the api server.
 */
const app = createExpressServer({
  routePrefix: "/api",
  controllers: [UserController]
});
export default app;
