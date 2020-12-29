#!/usr/bin/env node

import * as fs from "fs";
import { FlameSchema } from "../type";
import { preprocessSchema } from "./preprocess-schema";
import { generateFirebaseTrigger } from "./firebase/trigger-generator/trigger-generator";
import { generateFirebaseModel } from "./firebase/model-generator/model-generator";
import generateFirebaseUtil from "./firebase/util-generator";

const schemaJson = fs.readFileSync("../flamestore.json");
const schemaJsonString = schemaJson.toString();
const rawSchema = JSON.parse(schemaJsonString);
// modules.forEach(module => module.validateRaw && module.validateRaw(rawSchema));
const unprocessedSchema: FlameSchema = rawSchema;
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
generateFirebaseModel(triggerDir, schema);
generateFirebaseTrigger(triggerDir, schema);
generateFirebaseUtil(triggerDir, schema);
// generateFlutter(flutterPath, schema, modules);
