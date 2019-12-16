import * as mongoose from "mongoose";

async function main(): Promise<void> {
  console.log("App started");

  // Connect to the database
  await mongoose.connect("mongodb://localhost:27017/test_database", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });

  await mongoose.disconnect();
}

main();
