import _ from "lodash";
import { ImageField } from "../../generator-types";
import { t, toPascalColName } from "../../generator-utils";

export function getImageClassStr(
  field: ImageField,
  fData: {
    fName: string;
    colName: string;
  }
): string {
  const { fName, colName } = fData;
  const classNameStr = "_" + toPascalColName(colName) + _.upperFirst(fName);
  const fieldsStr = field.metadatas.map((x) => t`int ${x};`).join("");
  const fmStr = field.metadatas.map((x) => t`${x} = map['${x}'];`).join("");
  return t`class ${classNameStr} {
    String url;
    ${fieldsStr}
    ${classNameStr}._fromMap(Map<String, dynamic> map) {
      if (map != null) {
        url = map['url'];
        ${fmStr}
      }
    }
  }`;
}
