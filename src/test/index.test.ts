import { suite, describe, it } from "mocha";

suite("index", function(): void {
  describe("file", function(): void {
    it("should not crash", function(): void {
      require("../../index");
    });
  });
});
