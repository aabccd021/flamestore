import _ from "lodash";
import { mapPick } from "../../../lodash-utils";
import { PathField } from "../../generator-types";
import { suf, t, toPascalColName } from "../../generator-utils";
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
  const fieldsStr = field.syncFields
    .map((f) => toFieldStr({ ...f, colName: syncColName }))
    .flatMap()
    .map(suf(";"))
    .join("");
  //
  const constrArgs = syncFieldNames.map((x) => t`@required this.${x}`);
  const constrArgStr = constrArgs.isEmpty()
    ? ""
    : t`, {${constrArgs.join("")}}`;
  const constrAssgs = syncFieldNames.map((x) => t`'${x}': ${x},`);
  const constrAssgStr = constrAssgs.isEmpty()
    ? ""
    : t`,fields:{${constrAssgs.join("")}},`;
  //
  // TODO: unhandle if empty
  const fcAssgStr = syncFieldNames.map((x) => t`${x} = ${fName}.${x},`).join();
  const fcFieldAssgs = syncFieldNames.map((x) => t`'${x}' : ${fName}.${x},`);
  const fcFieldAssgStr = fcFieldAssgs.isEmpty()
    ? ""
    : t`,fields: {${fcFieldAssgs.join("")}},`;
  //
  const fromMapStr = syncFieldNames.map((x) => t`${x} = map['${x}'],`).join("");
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
