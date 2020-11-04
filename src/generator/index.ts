#!/usr/bin/env node

import generateTrigger from './code-generator';
import { FlamestoreSchema } from './types/schema';
import generateRule from './code-generator/rule-generator';
import { FlamestoreModule } from './types/module';
import { module as countModule } from './modules/count';
import { module as ownerModule } from './modules/owner';
import { module as schemaModule } from './modules/schema';
import { module as sumModule } from './modules/sum';
import { module as syncFromModule } from './modules/sync-from';
import * as fs from 'fs';

const modules: FlamestoreModule[] = [
  countModule,
  ownerModule,
  schemaModule,
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
// generateRule(schema, rulePath);
// const triggerPath = schema.configuration.triggerOutputPath || "functions/src/flamestore/";
// generateTrigger(schema, triggerPath);

