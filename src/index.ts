#!/usr/bin/env node

import { getSchema } from './utils/util';
import generateTrigger from './code-generator';
import validate from './validators/schema-validator';
import { FlamestoreSchema } from './utils/interface';
import generateRule from './code-generator/rule-generator';

const rawSchema = getSchema('flamestore.json');
validate(rawSchema);
const schema: FlamestoreSchema = rawSchema;
const rulePath = schema.configuration.ruleOutputPath || "firebase/functions/firestore.rules";
generateRule(schema, rulePath);
const triggerPath = schema.configuration.triggerOutputPath || "firebase/functions/src/flamestore/";
generateTrigger(schema, triggerPath);