import _ from "lodash";
import { Collection } from "../../generator-types";
import { processSchemaField } from "./schema-field-utils";
import {
  FlameSchemaAuth,
  ProjectConfiguration,
  SchemaCollection,
} from "../schema-types";

export function processSchemaCollection(param: {
  schemaCol: SchemaCollection;
  schemaColMap: { [colName: string]: SchemaCollection };
  colName: string;
  projects: { [name: string]: ProjectConfiguration };
  authentication?: FlameSchemaAuth;
}): Collection {
  const { schemaCol, authentication: auth, colName } = param;
  const { fields: schemaFields, ownerField } = schemaCol;
  const fields = _(schemaFields).map((schemaField, fName) => {
    const field = processSchemaField({ ...param, fName, schemaField });
    return { fName, field };
  });
  const keyFieldNames = schemaCol.keyFields ?? [];
  const isOwnerCol = auth?.userCollection === colName;
  return { ownerField, fields, keyFieldNames, isOwnerCol };
}
