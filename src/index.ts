import "dotenv/config";
import app from "./server/server";
import config from "config";

/**
 * The port the server will use. It's whatever is in the PORT environment variable.
 *
 * @default 3000
 */
const port = config.has("port") ? config.get("port") : 3000;

app.listen(port, () => {
  console.log(`App started on port: ${port}`);
});
