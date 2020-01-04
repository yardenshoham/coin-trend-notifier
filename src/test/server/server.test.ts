import server from "./../../index";
import { suite, describe, it } from "mocha";
import request from "supertest";
import { OK } from "http-status-codes";

suite("server.ts", function() {
  describe("GET /", function() {
    it("should respond with a 200 OK status code", async function() {
      return request(server)
        .get("/")
        .expect(OK);
    });
  });
});
