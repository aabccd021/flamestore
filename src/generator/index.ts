#!/usr/bin/env node

import generateTrigger from './code-generator';
import generateRule from './generate-rule';
import { module as countModule } from './modules/count';
import { module as documentIdModule } from './modules/document-id';
import { module as intModule } from './modules/int';
import { module as ownerModule } from './modules/owner';
import { module as pathModule } from './modules/path';
import { module as schemaModule } from './modules/schema';
import { module as stringModule } from './modules/string';
import { module as sumModule } from './modules/sum';
import { module as syncFromModule } from './modules/sync-from';
import { module as typeModule } from './modules/type';
import * as fs from 'fs';
import { FlamestoreModule } from './module';
import { FlamestoreSchema } from './schema';

const modules: FlamestoreModule[] = [
  typeModule,
  pathModule,
  countModule,
  documentIdModule,
  intModule,
  ownerModule,
  schemaModule,
  stringModule,
  sumModule,
  syncFromModule,
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
// const triggerPath = schema.configuration.triggerOutputPath || "functions/src/flamestore/";
// generateTrigger(schema, triggerPath);

