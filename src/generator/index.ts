#!/usr/bin/env node

import generateTrigger from './generate-triggers';
import generateRule from './generate-rule';
import { module as computedModule } from './modules/computed';
import { module as countModule } from './modules/count';
import { module as fieldRulesModule } from './modules/field-rules';
import { module as floatModule } from './modules/float';
import { module as intModule } from './modules/int';
import { module as keyModule } from './modules/key';
import { module as optionalModule } from './modules/optional';
import { module as ownerModule } from './modules/owner';
import { module as pathModule } from './modules/path';
import { module as stringModule } from './modules/string';
import { module as sumModule } from './modules/sum';
import { module as syncFromModule } from './modules/sync-from';
import { module as timestampModule } from './modules/timestamp';
import { module as uniqueModule } from './modules/unique';
import * as fs from 'fs';
import { FlamestoreModule, FlamestoreSchema } from '../type';
import { generateSchema } from './generate-schema';
import generateUtils from './generate-utils';

const modules: FlamestoreModule[] = [
  pathModule,
  fieldRulesModule,
  intModule,
  floatModule,
  keyModule,
  ownerModule,
  stringModule,
  sumModule,
  syncFromModule,
  timestampModule,
  uniqueModule,
  countModule,
  computedModule,
  optionalModule,
];

// validate raw schema
const schemaJson = fs.readFileSync('../flamestore.json');
const schemaJsonString = schemaJson.toString();
const rawSchema = JSON.parse(schemaJsonString);
modules.forEach(module => module.validateRaw && module.validateRaw(rawSchema));

// validate schema
const schema: FlamestoreSchema = rawSchema;
modules.forEach(module => module.validate && module.validate(schema));

// generate rule
const rulePath = schema.configuration.ruleOutputPath || "firestore/firestore.rules";
generateRule(schema, rulePath, modules);

const triggerDir = schema.configuration.triggerOutputPath || "functions/src/triggers";
// generate schema
if (!fs.existsSync(triggerDir)) {
  fs.mkdirSync(triggerDir, { recursive: true });
}
generateSchema(triggerDir, schema, modules);

// generate triggers
generateTrigger(schema, triggerDir, modules);

// generate utils
generateUtils(triggerDir, schema);
