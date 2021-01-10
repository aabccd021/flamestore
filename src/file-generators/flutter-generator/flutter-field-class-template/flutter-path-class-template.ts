import _ from "lodash";
import { PathField } from "../../generator-types";
import { suf, t, toPascalColName } from "../../generator-utils";
import { toFieldStr } from "../flutter-generator-template";

export function getPathClassStr(
  field: PathField,
  fData: {
    fName: string;
    colName: string;
  }
): string {
  const { fName, colName } = fData;
  const classNameStr = "_" + toPascalColName(colName) + _.upperFirst(fName);
  const fieldsStr = field.syncFields
    .map((f) => toFieldStr({ ...f, colName: field.colName }))
    .flatMap()
    .map(suf(";"))
    .join("");
  const constrArgs = field.syncFields.map(
    ({ fName }) => t`@required this.${fName}`
  );
  const constrArgStr = constrArgs.isEmpty() ? "" : t`, {${constrArgs}}`;
  const constrAssgs = field.syncFields.map(
    ({ fName }) => t`'${fName}': ${fName},`
  );
  const constrAssgStr = constrAssgs.isEmpty()
    ? ""
    : t`,fields: {${constrAssgs}},`;
  return t`class ${classNameStr} extends ReferenceField {
    ${classNameStr}(DocumentReference reference${constrArgStr})
      : super(reference${constrAssgStr});
    ${fieldsStr}
  }`;
}
