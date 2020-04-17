import { suite, describe, it } from "mocha";
import server from "./../../index";
import { userDbPromise } from "../../models/user";
import request from "supertest";
import UserDtoIn from "../../dtos/userDtoIn";
import { expect } from "chai";
import { ObjectId } from "mongodb";
import {
  OK,
  UNPROCESSABLE_ENTITY,
  UNAUTHORIZED,
  NO_CONTENT,
  CONFLICT,
  BAD_REQUEST,
} from "http-status-codes";
import jwt from "jsonwebtoken";
import config from "config";
import UserLoginDto from "../../dtos/userLoginDto";
import ChangePasswordDto from "./../../dtos/changePasswordDto";
import bcrypt from "bcrypt";
import UserService from "../../services/userService";
import UserUpdateDto from "../../dtos/userUpdateDto";

const route = "/api/users";
suite(`${route} (UserController)`, function () {
  this.afterEach(async function () {
    const userDb = await userDbPromise;
    return userDb.c.deleteMany({});
  });

  describe("POST / (signUp())", function () {
    it("should save the user, return a RegisteredUser object and a 200 OK status code", async function () {
      const email = "test.user@test.domain.com";
      const username = "Test_User";

      const userToRegister: UserDtoIn = {
        email,
        username,
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      const response = await request(server).post(route).send(userToRegister);

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

    it("should not save the user once they are already registered, return an error message and a 422 Unprocessable Entity status code", async function () {
      const userToRegister: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await request(server).post(route).send(userToRegister);

      const response = await request(server).post(route).send(userToRegister);

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("error");

      const userDb = await userDbPromise;
      expect(await userDb.count({})).to.equal(1);
    });

    it("should not save the user once they are already registered, return a ValidationError array and a 422 Unprocessable Entity status code", async function () {
      const userToRegister: UserDtoIn = {
        email: "Not a valid email",
        username: "Not a valid username",
        password: "123abc",
        phoneNumber: "Not a valid phone number",
        alertLimit: -100,
      };

      const response = await request(server).post(route).send(userToRegister);

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      expect(response.body).to.have.property("errors");
      expect(response.body.errors.length).to.equal(4);

      const userDb = await userDbPromise;
      expect(await userDb.count({})).to.equal(0);
    });
  });

  describe("POST /login (login())", function () {
    it("should return the jwt for the user and a 200 OK status", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      // sign up
      let response = await request(server).post(route).send(user);

      const id = response.body._id;

      const userLogin: UserLoginDto = {
        email: user.email,
        password: user.password,
      };

      response = await request(server).post(`${route}/login`).send(userLogin);

      expect(response.status).to.equal(OK);
      expect(response.body).to.have.property("jwt");
      expect(
        jwt.verify(response.body.jwt, config.get("jwtPrivateKey"))
      ).to.have.property("_id", id);
    });

    it("should return an error message and a 401 Unauthorized status when given a bad email or password", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      // sign up
      await request(server).post(route).send(user);

      let userLogin: UserLoginDto = {
        email: "bad email",
        password: user.password,
      };

      let response = await request(server)
        .post(`${route}/login`)
        .send(userLogin);

      expect(response.status).to.equal(UNAUTHORIZED);
      expect(response.body).to.have.property("error");

      userLogin = {
        email: user.email,
        password: "bad password",
      };

      response = await request(server).post(`${route}/login`).send(userLogin);

      expect(response.status).to.equal(UNAUTHORIZED);
      expect(response.body).to.have.property("error");
    });
  });

  describe("PATCH /password (changePassword())", function () {
    it("should change the user's password and return a 204 No Content status", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      // sign up
      await request(server).post(route).send(user);

      const login: UserLoginDto = {
        email: user.email,
        password: user.password,
      };

      const { jwt: userJwt } = (
        await request(server).post(`${route}/login`).send(login)
      ).body;

      const newPassword = "new_pa$$word";

      const changePasswordBody: ChangePasswordDto = {
        oldPassword: user.password,
        newPassword: newPassword,
      };

      const response = await request(server)
        .patch(`${route}/password`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(changePasswordBody);

      expect(response.status).to.equal(NO_CONTENT);
      const userDb = await userDbPromise;
      const userFromDb = await userDb.findOne({ email: user.email });

      expect(await bcrypt.compare(newPassword, userFromDb.password)).to.be.true;
    });

    it("should not change the password return a 422 Unprocessable Entity when given a wrong old password", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      // sign up
      await request(server).post(route).send(user);

      const login: UserLoginDto = {
        email: user.email,
        password: user.password,
      };

      const { jwt: userJwt } = (
        await request(server).post(`${route}/login`).send(login)
      ).body;

      const newPassword = "new_pa$$word";

      const changePasswordBody: ChangePasswordDto = {
        oldPassword: "not the old pass",
        newPassword: newPassword,
      };

      const response = await request(server)
        .patch(`${route}/password`)
        .set("Authorization", `Bearer ${userJwt}`)
        .send(changePasswordBody);

      expect(response.status).to.equal(UNPROCESSABLE_ENTITY);
      const userDb = await userDbPromise;
      const userFromDb = await userDb.findOne({ email: user.email });

      expect(
        await bcrypt.compare(newPassword, userFromDb.password)
      ).to.be.false;
    });
  });

  describe("PUT / (updateUser())", function () {
    it("should update a user's properties and return the updated user with a status of 200 OK", async function () {
      const user: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user);

      const { jwt } = (
        await request(server)
          .post(`${route}/login`)
          .send({ email: user.email, password: user.password })
      ).body;

      const update: UserUpdateDto = {
        email: "brandnewemail@gmail.com",
        username: "Cool_Test_User",
        alertLimit: 3600,
      };

      const response = await request(server)
        .put(route)
        .set("Authorization", `Bearer ${jwt}`)
        .send(update);

      expect(response.status).to.equal(OK);
      expect(response.body.email).to.equal(update.email);
      expect(response.body.username).to.equal(update.username);
      expect(response.body.alertLimit).to.equal(update.alertLimit);
      expect(response.body.phoneNumber).to.equal(user.phoneNumber);
    });

    it("should not update the user when given an email that already exists and return a status of 409 Conflict", async function () {
      const user1: UserDtoIn = {
        email: "test.user@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      await UserService.signUp(user1);

      const { jwt } = (
        await request(server)
          .post(`${route}/login`)
          .send({ email: user1.email, password: user1.password })
      ).body;

      const user2: UserDtoIn = {
        email: "test.user.2@test.domain.com",
        username: "my_username",
        password: "123abcd",
        alertLimit: 0,
      };

      await UserService.signUp(user2);

      const update: UserUpdateDto = {
        email: user2.email,
        username: "Cool_Test_User",
        alertLimit: 3600,
      };

      const response = await request(server)
        .put(route)
        .set("Authorization", `Bearer ${jwt}`)
        .send(update);

      expect(response.status).to.equal(CONFLICT);
      expect(response.body).to.have.property("error");
    });
  });

  describe("GET / (getUser())", function () {
    it("should return a RegisteredUserDto object and a 200 OK status code", async function () {
      const user: UserDtoIn = {
        email: "test@test.domain.com",
        username: "Test_User",
        password: "123abc",
        phoneNumber: "+972-524444444",
        alertLimit: 0,
      };

      // sign up
      const intialDto = (await request(server).post(route).send(user)).body;

      const login: UserLoginDto = {
        email: user.email,
        password: user.password,
      };

      // login
      const { jwt: userJwt } = (
        await request(server).post(`${route}/login`).send(login)
      ).body;

      const response = await request(server)
        .get(route)
        .set("Authorization", `Bearer ${userJwt}`)
        .send();

      expect(response.status).to.equal(OK);
      expect(response.body).deep.equal(intialDto);
    });

    it("should not return the dto if the user does not exist return a status of 400 Bad Request", async function () {
      const response = await request(server)
        .get(route)
        .set(
          "Authorization",
          `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTE5YjhlZmJlZDJlODUyYzA3NTU0ZTMiLCJpYXQiOjE1Nzg3NDQwNTZ9.lnf6tlSA1_EGFA23Ks_rOaZ2skd960zr5QeRc5vOonU`
        ) // jwt with bad id
        .send();

      expect(response.status).to.equal(BAD_REQUEST);
      expect(response.body).to.have.property("error");
    });
  });
});
