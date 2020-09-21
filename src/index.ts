#!/usr/bin/env node

import { getSchema } from './utils/util';
import yargs from 'yargs';
import generate from './code-generator';
import validate from './validators/schema-validator';
import { Schema } from './utils/interface';
import generateRule from './code-generator/rule-generator';

const args = yargs.options({
  'input-path': { type: 'string', demandOption: true, alias: 'i' },
  'trigger-output-path': { type: 'string', demandOption: false, alias: 'to' },
  'rule-output-path': { type: 'string', demandOption: false, alias: 'ro' },
}).argv;

const inputFilePath = args['input-path']
const rawSchema = getSchema(inputFilePath)
validate(rawSchema);
const schema: Schema = rawSchema;
if (args['rule-output-path']) {
  generateRule(schema, args['rule-output-path']);
}
if (args['trigger-output-path']) {
  generate(schema, args['trigger-output-path']);
}