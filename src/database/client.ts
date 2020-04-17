import { MongoClient } from "mongodb";
import config from "config";

/**
 * The connection to the database.
 */
export const clientPromise = MongoClient.connect(config.get("dbUrl"), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

clientPromise.then(() => {
  console.log("Connected to database.");
});
