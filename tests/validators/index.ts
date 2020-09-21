import { expect } from "chai";
import * as fs from 'fs';
import validate from "../../src/validators";


describe("validate", () => {
  it("Function pass if given sample twitter schema", () => {
    const schemaJson = fs.readFileSync('sample/flamestore2.json');
    const schemaJsonString = schemaJson.toString();
    const sampleTwitterSchema = JSON.parse(schemaJsonString);
    expect(() => validate(sampleTwitterSchema))
      .to.not.throw();
  });
});