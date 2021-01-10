import { CollectionEntry } from "../generator-types";
import { toPascalColName, t } from "../generator-utils";

export function getDefStr(colEntry: CollectionEntry): string {
  const { colName, col } = colEntry;
  const pascal = toPascalColName(colName);
  return t`final ${colName}Definition = DocumentDefinition< ${pascal} >(
    mapToDoc: (data) => ${pascal}._fromMap(data),
    docToMap: (doc) {
      return {};
    },
    creatableFields: [],
    updatableFields: [],
    counts: (doc) {
      return [];
    }
  );`;
}
