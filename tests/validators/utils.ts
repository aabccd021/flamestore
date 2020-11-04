import { expect } from "chai";
import { validateKeys, validateTypeOfPrimitive } from "../../src/utils";

describe("validateKeys", () => {
  it("Throw error if given same key in requiredKeys and optionalKeys", () => {
    const testArg = {
      object: {},
      requiredKeys: ["someKey"],
      optionalKeys: ["someKey"],
      stackTrace: "",
    }
    expect(() => validateKeys(testArg))
      .to.throw("Key someKey should be in either requiredKeys OR optionalKeys");
  });
  it("Throw error if object doesn't have required key", () => {
    const testArg = {
      object: { "someOptionalKey": "someOptionalValue" },
      requiredKeys: ["someRequiredKey"],
      optionalKeys: ["someOptionalKey"],
      stackTrace: "root",
    }
    expect(() => validateKeys(testArg))
      .to.throw("Missing Required Field: someRequiredKey on root");
  });
  it("Throw error if object is empty", () => {
    const testArg = {
      object: {},
      requiredKeys: ["someRequiredKey"],
      optionalKeys: ["someOptionalKey"],
      stackTrace: "root",
    }
    expect(() => validateKeys(testArg))
      .to.throw("Missing Required Field: someRequiredKey on root");
  });
  it("Throw error if object has invalid key", () => {
    const testArg = {
      object: {
        "someInvalidKey": "someInvalidValue"
      },
      requiredKeys: ["someRequiredKey"],
      optionalKeys: ["someOptionalKey"],
      stackTrace: "root",
    }
    expect(() => validateKeys(testArg))
      .to.throw("Invalid Key: someInvalidKey on root");
  });
  it("Function pass if object has required key and doesn't have invalid key", () => {
    const testArg = {
      object: { "someRequiredKey": "someRequiredValue" },
      requiredKeys: ["someRequiredKey"],
      optionalKeys: ["someOptionalKey"],
      stackTrace: "root",
    }
    expect(() => validateKeys(testArg))
      .to.not.throw();
  });
});

describe("validateTypeOfPrimitive", () => {
  it("Function pass if object is 'true' and type is 'boolean'", () => {
    expect(() => validateTypeOfPrimitive(true, "boolean", "user.isUnique"))
      .to.not.throw();
  });
  it("Throw error if object is '0' and type is 'boolean'", () => {
    expect(() => validateTypeOfPrimitive(0, "boolean", "user.isUnique"))
      .to.throw("Invalid Value: user.isUnique must have type of boolean.");
  });
});