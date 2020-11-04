#!/usr/bin/env node

import generateTrigger from './code-generator';
import generateRule from './code-generator/rule-generator';
import { module as countModule } from './modules/count';
import { module as ownerModule } from './modules/owner';
import { module as schemaModule } from './modules/schema';
import { module as sumModule } from './modules/sum';
import { module as syncFromModule } from './modules/sync-from';
import { module as documentIdModule } from './modules/document-id';
import * as fs from 'fs';
import { FlamestoreModule } from './module';
import { FlamestoreSchema } from './schema';

const modules: FlamestoreModule[] = [
  countModule,
  ownerModule,
  schemaModule,
  sumModule,
  syncFromModule,
  documentIdModule,
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
// generateRule(schema, rulePath);
// const triggerPath = schema.configuration.triggerOutputPath || "functions/src/flamestore/";
// generateTrigger(schema, triggerPath);

