#!/usr/bin/env node

import generateTrigger from './generate-triggers';
import generateRule from './generate-rule';
import { module as countModule } from './modules/count';
import { module as documentIdModule } from './modules/document-id';
import { module as fieldRulesModule } from './modules/field-rules';
import { module as intModule } from './modules/int';
import { module as keyModule } from './modules/key';
import { module as ownerModule } from './modules/owner';
import { module as pathModule } from './modules/path';
import { module as schemaModule } from './modules/schema';
import { module as stringModule } from './modules/string';
import { module as sumModule } from './modules/sum';
import { module as syncFromModule } from './modules/sync-from';
import { module as timestampModule } from './modules/timestamp';
import { module as typeModule } from './modules/type';
import { module as uniqueModule } from './modules/unique';
import * as fs from 'fs';
import { FlamestoreModule, FlamestoreSchema } from './type';
import { generateSchema } from './generate-schema';

const modules: FlamestoreModule[] = [
  typeModule,
  pathModule,
  documentIdModule,
  fieldRulesModule,
  intModule,
  keyModule,
  ownerModule,
  schemaModule,
  stringModule,
  sumModule,
  syncFromModule,
  timestampModule,
  uniqueModule,
  countModule,
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

const flamestoreDir = schema.configuration.triggerOutputPath || "functions/src/triggers/flamestore/";
// generate schema
if (!fs.existsSync(flamestoreDir)) {
  fs.mkdirSync(flamestoreDir, { recursive: true });
}
generateSchema(flamestoreDir, schema);

// generate triggers
generateTrigger(schema, flamestoreDir, modules);

