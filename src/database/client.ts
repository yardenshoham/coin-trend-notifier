import { MongoClient } from "mongodb";
import * as config from "config";

/**
 * The connection to the database.
 */
export const clientPromise = MongoClient.connect(config.get("dbUrl"), {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
