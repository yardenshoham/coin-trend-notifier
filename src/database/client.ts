import { MongoClient } from "mongodb";

/**
 * The connection to the database.
 */
export const clientPromise = MongoClient.connect(
  "mongodb://localhost:27017/test_database",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);
