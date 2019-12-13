import { Asset } from "../../../models/asset";
import { suite, describe, it } from "mocha";
import { expect } from "chai";

suite("Asset", function(): void {
  describe("constructor", function(): void {
    it("should be given a name and assign it", function(): void {
      const name = "name";
      const asset = new Asset(name);
      expect(asset.name).to.equal(name);
    });
  });
});
