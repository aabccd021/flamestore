import { SchemaCollection, SchemaField } from "./schema-types";
import { assertNever } from "../../types";
import { Field } from "../types";
import * as computed from "./schema-field-utils/schema-computed-utils";
import * as count from "./schema-field-utils/schema-count-utils";
import * as dynamicLink from "./schema-field-utils/schema-dynamic-link-utils";
import * as float from "./schema-field-utils/schema-float-utils";
import * as image from "./schema-field-utils/schema-image-utils";
import * as int from "./schema-field-utils/schema-int-utils";
import * as path from "./schema-field-utils/schema-path-utils";
import * as serverTimestamp from "./schema-field-utils/schema-server-timestamp-utils";
import * as string from "./schema-field-utils/schema-string-utils";
import * as sum from "./schema-field-utils/schema-sum-utils";

export function processSchemaField(
  field: SchemaField,
  fName: string,
  col: SchemaCollection,
  schemaColMap: { [colName: string]: SchemaCollection }
): Field {
  const data = { fName, col, schemaColMap };
  if (computed.isTypeOf(field)) return computed.process(field, data);
  if (count.isTypeOf(field)) return count.process(field, data);
  if (dynamicLink.isTypeOf(field)) return dynamicLink.process(field, data);
  if (float.isTypeOf(field)) return float.process(field, data);
  if (image.isTypeOf(field)) return image.process(field, data);
  if (int.isTypeOf(field)) return int.process(field, data);
  if (path.isTypeOf(field)) return path.process(field, data);
  if (serverTimestamp.isTypeOf(field))
    return serverTimestamp.toProcessed(field, data);
  if (string.isTypeOf(field)) return string.process(field, data);
  if (sum.isTypeOf(field)) return sum.process(field, data);
  assertNever(field);
}
