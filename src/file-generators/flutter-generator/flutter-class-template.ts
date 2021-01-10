import _ from "lodash";
import { assertNever } from "../../utils";
import {
  CollectionEntry,
  Field,
  ImageField,
  isComputedField,
  isCountField,
  isDynamicLinkField,
  isFloatField,
  isImageField,
  isIntField,
  isPathField,
  isServerTimestampField,
  isStringField,
  isSumField,
  PathField,
} from "../generator-types";
import { fieldColEntriesOfCol, t, toPascalColName } from "../generator-utils";
import {
  toCwAnonConstrAssgStr,
  toCwConstrArgStr,
  toCwNamedConstrAssgStr,
} from "./flutter-class-templates/flutter-class-copy-with-constructor-template";
import {
  toConstrArgStr,
  toConstrAssgStr,
} from "./flutter-class-templates/flutter-class-default-constructor-template";
import { toFromMapConstrAssgStr } from "./flutter-class-templates/flutter-class-from-map-constructor-template";
import { getKeyGetterStr } from "./flutter-class-templates/flutter-class-keys-template";
import {
  toAnonPrivConstrArgStr,
  toNamedPrivConstrArgStr,
} from "./flutter-class-templates/flutter-class-private-constructor-template";
import { flatSuf, compactSuf } from "./flutter-generator-utils";

export function toClassStr(colEntry: CollectionEntry): string {
  //
  const { colName } = colEntry;
  //
  const pascal = toPascalColName(colName);
  //
  //
  const fs = _(fieldColEntriesOfCol(colEntry));
  //
  const fieldStr = flatSuf(fs, toFieldStr, ";");
  //
  const constructorArgStr = flatSuf(fs, toConstrArgStr, ",");
  const constructorAssgStr = flatSuf(fs, toConstrAssgStr, ",");
  //
  const fromMapConstrAssgStr = flatSuf(fs, toFromMapConstrAssgStr, ",");
  //
  const anonPrivConstrArgStr = compactSuf(fs, toAnonPrivConstrArgStr, ",");
  const namedPrivConstrArgStr = compactSuf(fs, toNamedPrivConstrArgStr, ",");
  //
  const cwConstrArgStr = compactSuf(fs, toCwConstrArgStr, ",");
  const cwNamedConstrAssgStr = compactSuf(fs, toCwNamedConstrAssgStr, ",");
  const cwAnonConstrAssgStr = compactSuf(fs, toCwAnonConstrAssgStr, ",");
  //
  const keyGetterStr = getKeyGetterStr(fs);
  // TODO: remove empty lines
  //
  return t`class ${pascal} extends Document{
    ${pascal}({${constructorArgStr}}): ${constructorAssgStr} super(null);

    ${pascal}._fromMap(Map<String, dynamic> data)
      : ${fromMapConstrAssgStr} super(data['reference']);

    ${pascal}._(${anonPrivConstrArgStr}{
      ${namedPrivConstrArgStr}
      @required DocumentReference reference,
    }):super(reference);

    ${pascal} copyWith({${cwConstrArgStr}}){
      return ${pascal}._(
        ${cwAnonConstrAssgStr}
        ${cwNamedConstrAssgStr}
        reference: this.reference,
      );}
    ${fieldStr}

    @override
    String get colName => "${colName}";

    ${keyGetterStr}
  }`;
}

export function toFieldStr(params: {
  field: Field;
  fName: string;
  colName: string;
}): string[] {
  const { field, fName, colName } = params;
  if (isImageField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalImageFieldName = _.upperFirst(fName);
    return [
      t`final File _${fName}`,
      t`final _${pascalColName}${pascalImageFieldName} ${fName}`,
    ];
  }
  if (isPathField(field)) {
    const pascalColName = toPascalColName(colName);
    const pascalFieldName = _.upperFirst(fName);
    return [t`final _${pascalColName}${pascalFieldName} ${fName}`];
  }
  const fieldTypeStr: string = getNormalFieldTypeStr(field);
  return [t`final ${fieldTypeStr} ${fName}`];
}

function getNormalFieldTypeStr(
  field: Exclude<Field, ImageField | PathField>
): "int" | "String" | "double" | "DateTime" | "DocumentReference" {
  if (isCountField(field)) return "int";
  if (isDynamicLinkField(field)) return "String";
  if (isFloatField(field)) return "double";
  if (isIntField(field)) return "int";
  if (isServerTimestampField(field)) return "DateTime";
  if (isStringField(field)) return "String";
  if (isSumField(field)) return "double";
  if (isComputedField(field)) {
    if (field.computedFieldType === "float") return "double";
    if (field.computedFieldType === "int") return "int";
    if (field.computedFieldType === "string") return "String";
    if (field.computedFieldType === "timestamp") return "DateTime";
    assertNever(field.computedFieldType);
  }
  assertNever(field);
}
