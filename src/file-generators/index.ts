#!/usr/bin/env node

import * as fs from "fs";
import { FlamestoreSchema } from "../type";
import { preprocessSchema } from "./preprocess-schema";
import { generateSchema } from "./firebase-schema-generator";
import generateTrigger from "./firebase-trigger-generator/trigger-generator";

const schemaJson = fs.readFileSync("../flamestore.json");
const schemaJsonString = schemaJson.toString();
const rawSchema = JSON.parse(schemaJsonString);
// modules.forEach(module => module.validateRaw && module.validateRaw(rawSchema));
const unprocessedSchema: FlamestoreSchema = rawSchema;
// TODO: Validate circular reference
// TODO: reference field
// TODO: document has owner if want to upload image
// modules.forEach(module => module.validate && module.validate(schema));
const schema = preprocessSchema(unprocessedSchema);
// const rulePath = schema.ruleOutputPath ?? "firestore/firestore.rules";
const triggerDir = schema.triggerOutputPath ?? "functions/src/triggers";
// const flutterPath = schema.flutterOutputPath ?? "../flutter/lib/flamestore";
// generateRule(schema, rulePath, modules);
if (!fs.existsSync(triggerDir)) {
  fs.mkdirSync(triggerDir, { recursive: true });
}
generateSchema(triggerDir, schema);
generateTrigger(triggerDir, schema);
// generateUtils(triggerDir, schema);
// generateFlutter(flutterPath, schema, modules);
