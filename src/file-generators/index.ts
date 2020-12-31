#!/usr/bin/env node

import * as fs from "fs";
import { FlameSchema } from "./schema-processor/schema-types";
import { colEntryOfSchema } from "./schema-processor/schema-processor";
import { generateFirebaseTrigger } from "./firebase-generators/trigger-generator/trigger-generator";
import { generateFirebaseModel } from "./firebase-generators/model-generator/model-generator";
import generateFirebaseUtil from "./firebase-generators/util-generator";

const schemaJson = fs.readFileSync("../flamestore.json");
const schemaJsonString = schemaJson.toString();
const rawSchema = JSON.parse(schemaJsonString);
// modules.forEach(module => module.validateRaw && module.validateRaw(rawSchema));
const schema: FlameSchema = rawSchema;
// TODO: Validate circular reference
// TODO: reference field
// TODO: document has owner if want to upload image
// modules.forEach(module => module.validate && module.validate(schema));
const colEntries = colEntryOfSchema(schema);
// const rulePath = schema.ruleOutputPath ?? "firestore/firestore.rules";
const triggerDir = schema.triggerOutputPath ?? "functions/src/triggers";
// const flutterPath = schema.flutterOutputPath ?? "../flutter/lib/flamestore";
// generateRule(schema, rulePath, modules);
if (!fs.existsSync(triggerDir)) {
  fs.mkdirSync(triggerDir, { recursive: true });
}
generateFirebaseModel(triggerDir, colEntries);
generateFirebaseTrigger(triggerDir, colEntries);
generateFirebaseUtil(triggerDir, schema.region);
// generateFlutter(flutterPath, schema, modules);
