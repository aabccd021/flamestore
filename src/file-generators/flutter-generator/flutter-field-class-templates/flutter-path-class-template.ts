import _ from "lodash";
import { PathField } from "../../generator-types";
import {
  emptyOr,
  mapPick,
  suf,
  t,
  toPascalColName,
} from "../../generator-utils";
import { toFieldStr } from "../flutter-class-template";

export function getPathClassStr(
  field: PathField,
  fData: {
    fName: string;
    colName: string;
  }
): string {
  const { fName, colName } = fData;
  const syncColName = field.colName;
  const pascalSyncColName = toPascalColName(syncColName);
  const classNameStr = "_" + toPascalColName(colName) + _.upperFirst(fName);
  const syncFieldNames = mapPick(field.syncFields, "fName");
  //
  const fieldsStr = _(field.syncFields)
    .map((f) => toFieldStr({ ...f, colName: syncColName }))
    .flatMap()
    .map(suf(";"));
  //
  const constrArgs = syncFieldNames.map((x) => t`@required this.${x}`);
  const constrArgStr = constrArgs.isEmpty() ? "" : t`, {${constrArgs}}`;
  const constrAssgs = syncFieldNames.map((x) => t`'${x}': ${x},`);
  const constrAssgStr = emptyOr(constrAssgs, (x) => `,fields: {${x}},`);
  //
  // TODO: unhandle if empty
  const fcAssgStr = syncFieldNames.map((x) => t`${x} = ${fName}.${x},`).join();
  const fcFieldAssgs = syncFieldNames.map((x) => t`'${x}' : ${fName}.${x},`);
  const fcFieldAssgStr = emptyOr(fcFieldAssgs, (x) => `,fields: {${x}},`);
  //
  const fromMapStr = syncFieldNames.map((x) => t`${x} = map['${x}'],`);
  return t`class ${classNameStr} extends ReferenceField {
    ${classNameStr}(DocumentReference reference${constrArgStr})
      : super(reference${constrAssgStr});
    ${classNameStr}._from${pascalSyncColName}(${pascalSyncColName} ${fName})
      : ${fcAssgStr}super(${fName}.reference${fcFieldAssgStr});
    ${classNameStr}._fromMap(Map<String, dynamic> map)
      : ${fromMapStr}super.fromMap(map);
    ${fieldsStr}
  }`;
}
