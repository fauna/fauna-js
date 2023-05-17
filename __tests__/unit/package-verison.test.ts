import packageJson from "../../package.json";
import { packageVersion } from "../../src/util/package-version";

describe("package version", () => {
  it("is correct", () => {
    expect(packageJson.version).toEqual(packageVersion);
  });
});
