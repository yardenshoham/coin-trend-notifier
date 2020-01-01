import { suite, describe, it } from "mocha";
import server from "./../../index";
import { userDbPromise } from "../../models/user";
import request from "supertest";
import UserDtoIn from "./../../interfaces/dtos/userDtoIn";
import { expect } from "chai";
import { ObjectId } from "mongodb";
import { OK, UNPROCESSABLE_ENTITY } from "http-status-codes";

const route = "/api/users";
suite(`${route} (UserController)`, function() {
  this.afterEach(async function() {
    const userDb = await userDbPromise;
    return userDb.c.deleteMany({});
  });

  describe("POST / (signUp())", function() {
    it("should save the user, return a RegisteredUser object and a 200 OK status code", async function() {
      const email = "test.user@test.domain.com";
      const username = "Test_User";

      const userToRegister: UserDtoIn = {
        email,
        username,
        password: "123abc",
        phoneNumber: "+972-524444444"
      };

      const response = await request(server)
        .post(route)
        .send(userToRegister);

      expect(response.status).to.equal(OK);
      expect(response.body).to.have.property("email", email);
      expect(response.body).to.have.property("username", username);
      expect(response.body).to.have.property("_id");

      const userDb = await userDbPromise;
      const userFromDb = await userDb.findById(
        ObjectId.createFromHexString(response.body._id)
      );

      expect(userFromDb).not.to.be.null;
      expect(userFromDb).to.have.property("email", email);
      expect(userFromDb).to.have.property("username", username);
    });

    it("should not save the user once they are already registered, return an error message and a 422 Unprocessable Entity status code", async function() {
      const userToRegister: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444"
      };

      await request(server)
        .post(route)
        .send(userToRegister);

      const response = await request(server)
        .post(route)
        .send(userToRegister);

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("error");

      const userDb = await userDbPromise;
      expect(await userDb.count({})).to.equal(1);
    });

    it("should not save the user once they are already registered, return a ValidationError array and a 422 Unprocessable Entity status code", async function() {
      const userToRegister: UserDtoIn = {
        email: "Not a valid email",
        username: "Not a valid username",
        password: "123abc",
        phoneNumber: "Not a valid phone number"
      };

      const response = await request(server)
        .post(route)
        .send(userToRegister);

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("errors");
      expect(response.body.errors.length).to.equal(3);

      const userDb = await userDbPromise;
      expect(await userDb.count({})).to.equal(0);
    });
  });
});
