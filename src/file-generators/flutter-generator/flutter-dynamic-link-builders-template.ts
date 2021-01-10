import { mapPick } from "../../lodash-utils";
import { CollectionEntry, isDynamicLinkField } from "../generator-types";
import { t, toPascalColName, toSingularColName } from "../generator-utils";

export function getDynamicBuilderStr(colEntries: CollectionEntry[]): string {
  const dlColEntries = colEntries.filter(({ col }) =>
    mapPick(col.fields, "field").some(isDynamicLinkField)
  );
  const argStr = dlColEntries
    .map(({ colName }) => {
      const pascal = toPascalColName(colName);
      const singular = toSingularColName(colName);
      return `@required Widget Function(${pascal} ${singular}) ${singular}Builder,`;
    })
    .join("");
  const builderStr = dlColEntries
    .map(({ colName }) => {
      const pascal = toPascalColName(colName);
      const singular = toSingularColName(colName);
      return `'${colName}':(document) => ${singular}Builder(document as ${pascal}),`;
    })
    .join("");
  return t`Map<String, Widget Function(Document)> dynamicLinkBuilders({
    ${argStr}
  }){return {${builderStr}};}`;
}
