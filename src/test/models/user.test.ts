import { User } from "../../models/user";
import { suite, describe, it } from "mocha";
import { expect } from "chai";

suite("User", function(): void {
  describe("constructor", function(): void {
    it("should be given an email address, username and password and assign them", function(): void {
      const email = "abc@def.com";
      const username = "abcdef";
      const password = "abcdef-password";

      const user = new User(email, username, password);

      expect(user).to.have.property("email", email);
      expect(user).to.have.property("username", username);
      expect(user).to.have.property("password", password);
    });

    it("should be given an email address, username, password and phone number and assign them", function(): void {
      const email = "abc@def.com";
      const username = "abcdef";
      const password = "abcdef-password";
      const phoneNumber = "0521234567";

      const user = new User(email, username, password, phoneNumber);

      expect(user).to.have.property("email", email);
      expect(user).to.have.property("username", username);
      expect(user).to.have.property("password", password);
      expect(user).to.have.property("phoneNumber", phoneNumber);
    });
  });
});
