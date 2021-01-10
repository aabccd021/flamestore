import { SchemaCollection, SchemaField } from "../schema-types";
import { Field } from "../../generator-types";
import * as computed from "../schema-field-utils/schema-computed-utils";
import * as count from "../schema-field-utils/schema-count-utils";
import * as dynamicLink from "../schema-field-utils/schema-dynamic-link-utils";
import * as float from "../schema-field-utils/schema-float-utils";
import * as image from "../schema-field-utils/schema-image-utils";
import * as int from "../schema-field-utils/schema-int-utils";
import * as path from "../schema-field-utils/schema-path-utils";
import * as serverTimestamp from "../schema-field-utils/schema-server-timestamp-utils";
import * as string from "../schema-field-utils/schema-string-utils";
import * as sum from "../schema-field-utils/schema-sum-utils";
import { assertNever } from "../../../utils";

export function processSchemaField(param: {
  schemaField: SchemaField;
  fName: string;
  schemaCol: SchemaCollection;
  schemaColMap: { [colName: string]: SchemaCollection };
}): Field {
  const { schemaField: field } = param;
  if (computed.isTypeOf(field)) return computed.process(field, param);
  if (count.isTypeOf(field)) return count.process(field, param);
  if (dynamicLink.isTypeOf(field)) return dynamicLink.process(field, param);
  if (float.isTypeOf(field)) return float.process(field, param);
  if (image.isTypeOf(field)) return image.process(field, param);
  if (int.isTypeOf(field)) return int.process(field, param);
  if (serverTimestamp.isTypeOf(field))
    return serverTimestamp.process(field, param);
  if (string.isTypeOf(field)) return string.process(field, param);
  if (sum.isTypeOf(field)) return sum.process(field, param);
  if (path.isTypeOf(field)) return path.process(field, param);
  assertNever(field);
}
