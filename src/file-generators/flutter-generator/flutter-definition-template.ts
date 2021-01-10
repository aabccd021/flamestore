import _ from "lodash";
import { CollectionEntry, FieldCollectionEntry } from "../generator-types";
import { toPascalColName, t, fieldColEntriesOfCol } from "../generator-utils";
import { toDocToMapStr } from "./flutter-definition-templates/flutter-definition-doc-to-map-template";
import {
  isFieldFirestoreCreatable,
  isFieldFirestoreUpdatable,
} from "./flutter-definition-templates/flutter-definition-field-utils";

export function getDefStr(colEntry: CollectionEntry): string {
  const { colName } = colEntry;
  const pascal = toPascalColName(colName);
  const fcEntries = _(fieldColEntriesOfCol(colEntry));
  const creatableFieldsStr = filterMap(fcEntries, isFieldFirestoreCreatable);
  const updatableFieldsStr = filterMap(fcEntries, isFieldFirestoreUpdatable);
  const docToMapStr = fcEntries.map(toDocToMapStr).join("");
  return t`final ${pascal}Definition = DocumentDefinition< ${pascal} >(
    mapToDoc: (data) => ${pascal}._fromMap(data),
    docToMap: (doc) {return {${docToMapStr}};},
    creatableFields: [${creatableFieldsStr}],
    updatableFields: [${updatableFieldsStr}],
    counts: (doc) { return [];},
    sums: (doc) { return [];},
  );`;
}

function filterMap(
  fcEntries: _.Collection<FieldCollectionEntry>,
  filterFn: (fcEntry: FieldCollectionEntry) => boolean
): string {
  return fcEntries
    .filter(filterFn)
    .map(({ fName }) => t`'${fName}',`)
    .join("");
}
