import {
  CollectionIteration,
  Field,
  FieldIteration,
  FlamestoreSchema,
  ImageField,
  PrimitiveFieldTypes,
  ReferenceField,
} from "../type";
import { FlamestoreModule } from "./type";
import path from "path";
import * as fs from "fs";
import {
  colItersOf,
  fItersOf,
  isFieldCreatable,
  isTypeCount,
  isTypeDynamicLink,
  isTypeFloat,
  isTypeInt,
  isTypeReference,
  isTypeString,
  isTypeSum,
  isFlutterFieldRequired,
  isTypeImage,
  isFieldUpdatable,
  isTypeDatetime,
  assertNever,
} from "./util";
import _ from "lodash";
import pluralize from "pluralize";

export function generateFlutter(
  outputFilePath: string,
  schema: FlamestoreSchema,
  modules: FlamestoreModule[]
) {
  const content =
    imports +
    colItersOf(schema)
      .map((colIter) => classString(colIter, modules))
      .join("") +
    projectString(schema);
  fs.writeFileSync(path.join(outputFilePath, "flamestore.g.dart"), content);
}

function projectString(schema: FlamestoreSchema) {
  const colsWithDynamicLink = colItersOf(schema).filter((colIter) =>
    fItersOf(colIter).some(({ field }) => isTypeDynamicLink(field))
  );
  return `
  final config = FlamestoreConfig(
    projects: {
      ${_(schema.project)
        .map((project, projectName) => {
          const domain = project.domain;
          const dlDomain = project.dynamicLinkDomain;
          const apName = project.androidPackageName;
          return `
        '${projectName}': ProjectConfig(
          ${domain ? `domain: '${domain}',` : ""}
          ${dlDomain ? `dynamicLinkDomain: '${dlDomain}',` : ""}
          ${apName ? `androidPackageName: '${apName}',` : ""}
        ),`;
        })
        .join("")}
    },
    collectionClassMap: {
      ${colItersOf(schema)
        .map(({ colName, pascalColName }) => `${pascalColName}: '${colName}',`)
        .join("")}
    },
    documentDefinitions: {
      ${colItersOf(schema)
        .map(
          ({ colName, singularColName }) =>
            `'${colName}':${singularColName}Definition,`
        )
        .join("")}
    },
  );

  Map<String, Widget Function(Document)> dynamicLinkBuilders({
    ${colsWithDynamicLink
      .map(
        ({ singularColName, pascalColName }) =>
          `@required Widget Function(${pascalColName} ${singularColName}) ${singularColName}Builder,`
      )
      .join("")}
  }) {
    return {
    ${colsWithDynamicLink
      .map(
        ({ colName, singularColName, pascalColName }) =>
          `'${colName}': (document) => ${singularColName}Builder(document as ${pascalColName}),`
      )
      .join("")}
    };
  }
  `;
}

const imports = `
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:flamestore/flamestore.dart';
import 'package:flutter/widgets.dart';
`;

// function refClassString(): string {}

function isFlutterCreatable(
  fIter: FieldIteration,
  modules: FlamestoreModule[]
) {
  const { field } = fIter;
  return isFieldCreatable(fIter, modules) && !isTypeDynamicLink(field);
}

function classString(
  colIter: CollectionIteration,
  modules: FlamestoreModule[]
): string {
  const { colName, schema, col, pascalColName } = colIter;
  const fields = fItersOf(colIter);

  const creatableFields = fields.filter((f) => isFlutterCreatable(f, modules));
  const nonCreatableFields = fields.filter(
    (f) => !isFlutterCreatable(f, modules)
  );
  const updatableFields = fields.filter((fIter) =>
    isFieldUpdatable(fIter, modules)
  );
  const creatableThisField = creatableFields
    .map((fIter) => {
      const { fName } = fIter;
      const required = isFlutterFieldRequired(fIter, modules)
        ? "@required"
        : "";
      return `${required} this.${fName},`;
    })
    .join("");

  const keys =
    schema.authentication?.userCollection === colName
      ? `${schema.authentication.uidField}`
      : col.keyFields
          ?.map((keyFName) => `${keyFName}.reference?.id,`)
          .join("") ?? "";

  return `

  class ${pascalColName} extends Document {

    ${pascalColName}({
      ${creatableThisField}
    }): ${nonCreatableFields
      .map((f) => `${f.fName}= ${defaultValue(f)},`)
      .join("")}
    super(null);

    ${pascalColName}._fromMap(Map<String, dynamic> data)
        : ${fields.map((f) => `${f.fName} = ${fromMap(f)},`).join("")}
        super(data['reference']);

    ${pascalColName}._({
      ${fields.map(({ fName }) => `@required this.${fName},`).join("")}
      @required DocumentReference reference,
    }):super(reference);
   ${pascalColName} copyWith({
     ${updatableFields.map((f) => `${typeOf(f)} ${f.fName},`).join("")}
   }){
     return ${pascalColName}._(
       ${fields
         .map((f) => `${f.fName}: ${copyWithAssign(f, modules)},`)
         .join("")}
       reference: this.reference,
     );
   }
   ${fields.map((fIter) => `final ${typeOf(fIter)} ${fIter.fName};`).join("")}

   @override
   String get colName => "${colName}";

   @override
   List<String> get keys {
     return [${keys}];
   }
  }


  final ${pluralize.singular(
    colName
  )}Definition = DocumentDefinition<${pascalColName}>(
    mapToDoc: (data) => ${pascalColName}._fromMap(data),
    docToMap:(doc){
      return {
        ${fields.map((f) => `'${f.fName}': ${docToMap(f)},`).join("")}
      };
    },
    creatableFields: [
      ${creatableFields.map(({ fName }) => `'${fName}',`).join("")}
    ],
    updatableFields: [
      ${updatableFields.map(({ fName }) => `'${fName}',`).join("")}
    ],
  );
  `;
}

function fromMap(fIter: FieldIteration): string {
  const { fName } = fIter;
  return `${fromMapFieldName(fIter)}Field.fromMap(data['${fName}']).value`;
}

function docToMap(fIter: FieldIteration): string {
  const { fName } = fIter;
  return `${fromMapFieldName(fIter)}Field(doc.${fName})`;
}

// function assignFromRef(fIter: {
//   field: ReferenceField;
//   fName: string;
//   col: Collection;
//   colName: string;
//   schema: FlamestoreSchema;
// }) {
//   return `${typeOf(fIter)}.from${pascalOfCol(fIter.field.collection)}(
//             ${fIter.fName}:${fIter.fName})`;
// }

function defaultValue(fIter: FieldIteration): string {
  const { field } = fIter;
  if (isTypeReference(field)) return "zzzz";
  if (isTypeCount(field) || isTypeSum(field)) return "0";
  return "null";
}
function copyWithAssign(
  fIter: FieldIteration,
  modules: FlamestoreModule[]
): string {
  const { fName } = fIter;
  const thisFname = `this.${fName}`;
  return isFieldUpdatable(fIter, modules)
    ? `${fName} ??${thisFname}`
    : thisFname;
}

type primitiveTypes =
  | "String"
  | "int"
  | "double"
  | "DateTime"
  | "DocumentReference";

function typeOf(fIter: FieldIteration): string {
  const { field } = fIter;
  if (isTypeReference(field)) {
    return "_HA";
  }
  return typeOfPrimitive(field);
}

function typeOfPrimitive(
  field: Exclude<Field, ReferenceField>
): primitiveTypes {
  if (field === "serverTimestamp") return "DateTime";
  if (isTypeString(field)) return "String";
  if (isTypeInt(field)) return "int";
  if (isTypeFloat(field)) return "double";
  if (isTypeCount(field)) return "int";
  if (isTypeSum(field)) return "double";
  if (isTypeDatetime(field)) return "DateTime";
  if (isTypeDynamicLink(field)) return "String";
  if (isTypeImage(field)) return "String";
  return typeOfComputed(field.compute);
}

function typeOfComputed(compute: PrimitiveFieldTypes): primitiveTypes {
  if (compute === "float") return "double";
  if (compute === "int") return "int";
  if (compute === "path") return "DocumentReference";
  if (compute === "timestamp") return "DateTime";
  if (compute === "string") return "String";
  throw Error(`${compute}`);
}
type primitiveFieldName =
  | "String"
  | "Int"
  | "Float"
  | "Timestamp"
  | "Sum"
  | "Count"
  | "DynamicLink"
  | "Reference";

function fromMapFieldName(fIter: FieldIteration): string {
  const { field, pascalColName, pascalFName } = fIter;
  if (isTypeReference(field)) {
    return "b";
  }
  if (isTypeImage(field)) {
    return `_${pascalColName}${pascalFName}`;
  }
  return fromMapFieldNamePrimitive(field);
}

function fromMapFieldNamePrimitive(
  field: Exclude<Field, ReferenceField | ImageField>
): primitiveFieldName {
  if (isTypeString(field)) return "String";
  if (isTypeCount(field)) return "Count";
  if (isTypeSum(field)) return "Sum";
  if (isTypeFloat(field)) return "Float";
  if (isTypeInt(field)) return "Int";
  if (isTypeDatetime(field)) return "Timestamp";
  if (isTypeDynamicLink(field)) return "DynamicLink";
  if (field === "serverTimestamp") return "Timestamp";
  return fromMapComputedFieldName(field.compute);
}

function fromMapComputedFieldName(
  compute: PrimitiveFieldTypes
): primitiveFieldName {
  if (compute === "float") return "Float";
  if (compute === "int") return "Int";
  if (compute === "timestamp") return "Timestamp";
  if (compute === "string") return "String";
  if (compute === "path") return "Reference";
  assertNever(compute);
}
