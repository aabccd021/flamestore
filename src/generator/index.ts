#!/usr/bin/env node

import generateTrigger from "./generate-triggers";
import generateRule from "./generate-rule";
import { module as computedModule } from "./modules/computed";
import { module as countModule } from "./modules/count";
import { module as dynamicLinkModule } from "./modules/dynamic-link";
import { module as fieldRulesModule } from "./modules/field-rules";
import { module as floatModule } from "./modules/float";
import { module as intModule } from "./modules/int";
import { module as keyModule } from "./modules/key";
import { module as optionalModule } from "./modules/optional";
import { module as ownerModule } from "./modules/owner";
import { module as pathModule } from "./modules/path";
import { module as stringModule } from "./modules/string";
import { module as sumModule } from "./modules/sum";
import { module as timestampModule } from "./modules/timestamp";
import { module as uniqueModule } from "./modules/unique";
import * as fs from "fs";
import { FlamestoreSchema } from "../type";
import { generateSchema } from "./generate-schema";
import generateUtils from "./generate-utils";
import { preprocessSchema } from "./preprocess-schema";
import { FlamestoreModule } from "./type";
import { generateFlutter } from "./generate-flutter";

const modules: FlamestoreModule[] = [
  pathModule,
  fieldRulesModule,
  intModule,
  floatModule,
  ownerModule,
  stringModule,
  sumModule,
  timestampModule,
  uniqueModule,
  countModule,
  computedModule,
  optionalModule,
  dynamicLinkModule,
  keyModule,
];

const schemaJson = fs.readFileSync("../flamestore.json");
const schemaJsonString = schemaJson.toString();
const rawSchema = JSON.parse(schemaJsonString);
// modules.forEach(module => module.validateRaw && module.validateRaw(rawSchema));
const unprocessedSchema: FlamestoreSchema = rawSchema;
// TODO: Validate circular reference
// modules.forEach(module => module.validate && module.validate(schema));
const schema = preprocessSchema(unprocessedSchema, modules);
const rulePath = schema.ruleOutputPath ?? "firestore/firestore.rules";
const triggerDir = schema.triggerOutputPath ?? "functions/src/triggers";
const flutterPath = schema.flutterOutputPath ?? "../flutter/lib/flamestore";
generateRule(schema, rulePath, modules);
if (!fs.existsSync(triggerDir)) {
  fs.mkdirSync(triggerDir, { recursive: true });
}
generateSchema(triggerDir, schema, modules);
generateTrigger(triggerDir, schema, modules);
generateUtils(triggerDir, schema);
generateFlutter(flutterPath, schema, modules);
