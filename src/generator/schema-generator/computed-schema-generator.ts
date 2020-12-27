import {
  CollectionIteration as CIter,
  CollectionIteration,
  FlamestoreSchema as Schema,
} from "../../type";
import _ from "lodash";
import { colItersOf, fItersOf, isFieldComputed } from "../util";

export function getComputedSchemaString(schema: Schema): string {
  return colItersOf(schema)
    .filter(filterComputed)
    .map(getComputedSchemaColString)
    .join("");
}

function filterComputed({ col }: CIter): boolean {
  return _(col.fields).some(isFieldComputed);
}

function getComputedSchemaColString(colIter: CIter): string {
  const { pascalColName: pascal, colName } = colIter;
  const params = getComputedFieldParams(colIter);
  return `
    const ${colName}ComputeFields = [${params}] as const;
    type ${pascal}C = typeof ${colName}ComputeFields[number];
    export function compute${pascal}<D extends keyof Omit<${pascal},${pascal}C>>({
      dependencyFields,
      onCreate,
      onUpdate,
    }: {
      dependencyFields: D[];
      onCreate: onCreateFn<${pascal}, ${pascal}C>;
      onUpdate: onUpdateFn<${pascal}, ${pascal}C, D>;
    }) {
      return computeDocument(
        "${colName}",
        ${colName}ComputeFields,
        dependencyFields,
        onCreate,
        onUpdate,
      )
    }`;
}

function getComputedFieldParams(colIter: CollectionIteration): string {
  return fItersOf(colIter)
    .filter(({ field }) => isFieldComputed(field))
    .map(({ fName }) => `"${fName}"`)
    .join(",");
}
