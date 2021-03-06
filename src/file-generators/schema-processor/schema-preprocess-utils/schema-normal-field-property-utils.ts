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
import {
  SchemaField,
  NormalSchemaFieldProperties,
  NormalSchemaField,
} from "../schema-types";
// import flatMap instead of default import _ to be compatible with
// ts-json-schema-generator
import { flatMap } from "lodash";

export function hasFieldProperty(
  field: SchemaField,
  property: NormalSchemaFieldProperties
): boolean {
  if (!isNormalSchemaField(field)) return false;
  if (!field.property) return false;
  if (flatMap([field.property]).includes(property)) return true;
  return false;
}
function isNormalSchemaField(field: SchemaField): field is NormalSchemaField {
  if (computed.isTypeOf(field)) return false;
  if (count.isTypeOf(field)) return false;
  if (dynamicLink.isTypeOf(field)) return true;
  if (float.isTypeOf(field)) return true;
  if (image.isTypeOf(field)) return true;
  if (int.isTypeOf(field)) return true;
  if (path.isTypeOf(field)) return true;
  if (serverTimestamp.isTypeOf(field)) return false;
  if (string.isTypeOf(field)) return true;
  if (sum.isTypeOf(field)) return false;
  assertNever(field);
}
