import _ from "lodash";
import { Collection } from "../../generator-types";
import { processSchemaField } from "./schema-field-utils";
import { SchemaCollection, SchemaField } from "../schema-types";
import * as path from "../schema-field-utils/schema-path-utils";
import * as string from "../schema-field-utils/schema-string-utils";

export function processSchemaCollection(param: {
  schemaCol: SchemaCollection;
  schemaColMap: { [colName: string]: SchemaCollection };
  colName: string;
}): Collection {
  const { schemaCol } = param;
  const { fields: schemaFields, ownerField: schemaOwnerField } = schemaCol;
  const ownerField = getOwnerField({ schemaOwnerField, schemaCol });
  const fields = _(schemaFields).map((schemaField, fName) => {
    const field = processSchemaField({ ...param, fName, schemaField });
    return { fName, field };
  });
  const keyFieldNames = schemaCol.keyFields ?? [];
  return { ownerField, fields, keyFieldNames };
}

function getOwnerField(param: {
  schemaOwnerField?: string;
  schemaCol: SchemaCollection;
}): { name: string; type: "reference" | "string" } | undefined {
  const { schemaCol, schemaOwnerField } = param;
  if (!schemaOwnerField) return undefined;
  const field = schemaCol.fields[schemaOwnerField];
  const type = getOwnerFieldType(field);
  return { name: schemaOwnerField, type };
}

function getOwnerFieldType(field: SchemaField): "reference" | "string" {
  if (path.isTypeOf(field)) return "reference";
  if (string.isTypeOf(field)) return "string";
  throw Error();
}
