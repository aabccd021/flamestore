#!/usr/bin/env node

import * as fs from "fs";
import { FlameSchema } from "./schema-processor/schema-types";
import { processSchema } from "./schema-processor/schema-processor";
import { generateFirebaseTrigger } from "./firebase-generators/trigger-generator/trigger-generator";
import { generateFirebaseModel } from "./firebase-generators/model-generator/model-generator";
import generateFirebaseUtil from "./firebase-generators/util-generator";
import { generateFlutter } from "./flutter-generator/flutter-generator";
import { generateFirebaseRule } from "./firebase-generators/rule-generator/rule-generator";

const schemaJson = fs.readFileSync("../flamestore.json");
const schemaJsonString = schemaJson.toString();
const rawSchema = JSON.parse(schemaJsonString);
// modules.forEach(module => module.validateRaw && module.validateRaw(rawSchema));
const schema: FlameSchema = rawSchema;
// TODO: Validate circular reference
// TODO: reference field
// TODO: document has owner if want to upload image
// TODO: user col auth field should not be specified in json
// TODO: only allow is unique on string
// modules.forEach(module => module.validate && module.validate(schema));
const colEntries = processSchema(schema);
const rulePath = schema.ruleOutputPath ?? "firestore/firestore.rules";
const triggerDir = schema.triggerOutputPath ?? "functions/src/triggers";
const flutterPath = schema.flutterOutputPath ?? "../flutter/lib/flamestore";
//
generateFirebaseRule(rulePath, colEntries);
//
if (!fs.existsSync(triggerDir)) fs.mkdirSync(triggerDir, { recursive: true });
generateFirebaseModel(triggerDir, colEntries);
generateFirebaseTrigger(triggerDir, colEntries);
generateFirebaseUtil(triggerDir, schema.region);
//
generateFlutter(flutterPath, colEntries, schema.project);
