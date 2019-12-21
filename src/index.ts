import "dotenv/config";
import app from "./server/server";
import config from "config";

// start the server
const port = config.has("port") ? config.get("port") : 3000;

app.listen(port, () => {
  console.log(`App started on port: ${port}`);
});
