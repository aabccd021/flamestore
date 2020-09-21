import * as fs from 'fs';
import { Schema } from "./interface";

export function getSchema(inputFilePath: string): Schema {
  const schemaJson = fs.readFileSync(inputFilePath);
  const schemaJsonString = schemaJson.toString();
  return JSON.parse(schemaJsonString);
}

