import * as fs from 'fs';
import { FlamestoreSchema } from "./interface";

export function getSchema(inputFilePath: string): FlamestoreSchema {
  const schemaJson = fs.readFileSync(inputFilePath);
  const schemaJsonString = schemaJson.toString();
  return JSON.parse(schemaJsonString);
}

