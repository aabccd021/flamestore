import {
  Collection,
  CollectionIteration,
  DynamicLinkAttribute,
  FieldIteration,
  FlamestoreSchema,
  ReferenceField,
} from "../type";
import { FlamestoreModule } from "./type";
import path from "path";
import * as fs from "fs";
import {
  colIterOf,
  fIterOf,
  getPascal,
  pascalColName as pascalOfCol,
  getSyncFields,
  isDynamicLinkAttributeFromField,
  isFieldCreatable,
  isFieldRequired,
  isTypeComputed,
  isTypeCount,
  isTypeDatetime,
  isTypeDynamicLink,
  isTypeFloat,
  isTypeInt,
  isTypeReference,
  isTypeString,
  isTypeSum,
  richColIterOf,
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
    colIterOf(schema)
      .map((colIter) => classString(colIter, modules))
      .join("") +
    projectString(schema);
  fs.writeFileSync(path.join(outputFilePath, "flamestore.g.dart"), content);
}

function projectString(schema: FlamestoreSchema) {
  const colsWithDynamicLink = richColIterOf(schema).filter((colIter) =>
    fIterOf(colIter).some(({ field }) => isTypeDynamicLink(field))
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
      ${richColIterOf(schema)
        .map(({ colName, pascal }) => `${pascal}: '${colName}',`)
        .join("")}
    },
    documentDefinitions: {
      ${richColIterOf(schema)
        .map(({ colName, singular }) => `'${colName}':${singular}Definition,`)
        .join("")}
    },
  );

  Map<String, Widget Function(Document)> dynamicLinkBuilders({
    ${colsWithDynamicLink
      .map(
        ({ singular, pascal }) =>
          `@required Widget Function(${pascal} ${singular}) ${singular}Builder,`
      )
      .join("")}
  }) {
    return {
    ${colsWithDynamicLink
      .map(
        ({ colName, singular, pascal }) =>
          `'${colName}': (document) => ${singular}Builder(document as ${pascal}),`
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

function classString(
  colIter: CollectionIteration,
  modules: FlamestoreModule[]
) {
  const { colName, schema, col } = colIter;
  const pascal = pascalOfCol(colName);
  const singular = pluralize.singular(colName);
  const fields = fIterOf(colIter);
  const thisField = fields.map(({ fName }) => `this.${fName},`).join("");
  const colDoc = `final ${singular}Doc = doc as ${pascal};`;

  const referenceClasses = _(fields)
    .map((fIter) => {
      const { fName, field } = fIter;
      if (!isTypeReference(field)) {
        return null;
      }
      const syncFields = getSyncFields(field, colIter);
      const finalTypeField = syncFields
        .map((fIter) => `final ${dataTypeString(fIter)} ${fIter.fName};`)
        .join("");
      const thisField = syncFields
        .map(({ fName }) => `@required this.${fName},`)
        .join("");
      const privateAssign = syncFields
        .map(({ fName: syncFName }) => `,${syncFName}= ${fName}.${syncFName}`)
        .join("");
      const typeField = syncFields
        .map((fIter) => `${dataTypeString(fIter)} ${fIter.fName},`)
        .join("");
      const fieldFieldThisField = syncFields
        .map(({ fName }) => `${fName}: ${fName} ?? this.${fName},`)
        .join("");
      const dataMap = syncFields
        .map(({ fName }) => `'${fName}': ${fName},`)
        .join("");
      const fromMap = syncFields
        .map(({ fName }) => `,${fName}= map['${fName}']`)
        .join("");
      const refPascal = pascalOfCol(field.collection);
      return `class _${pascal}${getPascal(fName)}{
        _${pascal}${getPascal(fName)}({
          @required this.reference,
          ${thisField}
        });

        _${pascal}${getPascal(fName)}.from${refPascal}({
          @required ${refPascal} ${fName},
        }): reference = ${fName}.reference
          ${privateAssign};

        _${pascal}${getPascal(fName)}.fromMap(
          Map<String, dynamic> map,
        ): reference = map['reference']
        ${fromMap};

        final DocumentReference reference;
        ${finalTypeField}

        Map<String, dynamic> toDataMap(){
          return {
            'reference': reference,
            ${dataMap}
          };
        }

        _${pascal}${getPascal(fName)} copyWith({
          DocumentReference reference,
          ${typeField}
        }) {
          return _${pascal}${getPascal(fName)}(
            reference: reference ?? this.reference,
            ${fieldFieldThisField}
          );
        }
      }`;
    })
    .compact()
    .join("");
  const finalField = fields
    .map((fIter) =>
      isFieldCreatable(fIter, modules)
        ? `final ${dataTypeString(fIter)} ${fIter.fName};`
        : `${dataTypeString(fIter)} ${fIter.fName};`
    )
    .join("");
  function fieldFromMap(fIter: FieldIteration) {
    const { fName, field } = fIter;
    if (isTypeReference(field)) {
      return `${dataTypeString(fIter)}.fromMap(data['${fName}'])`;
    }
    if (isTypeDatetime(field) || field === "serverTimestamp") {
      return `data['${fName}'] is DateTime ? data['${fName}'] : data['${fName}']?.toDate()`;
    }
    if (isTypeFloat(field)) {
      return `data['${fName}']?.toDouble()`;
    }
    if (isTypeComputed(field)) {
      if (field.compute === "float") {
        return `data['${fName}']?.toDouble()`;
      }
    }
    return `data['${fName}']`;
  }
  const fieldDataField = fields
    .map((fIter) => `${fIter.fName}: ${fieldFromMap(fIter)},`)
    .join("");
  const creatableFields = fields.filter((fIter) =>
    isFieldCreatable(fIter, modules)
  );
  const creatableThisField = creatableFields
    .map((fIter) => {
      const { field, fName } = fIter;
      const required = isFieldRequired(fIter, modules) ? "@required" : "";
      const prefix = isTypeReference(field)
        ? `${pascalOfCol(field.collection)} `
        : "this.";
      return `${required} ${prefix}${fName},`;
    })
    .join("");
  function getDLAttributeString(attr: DynamicLinkAttribute) {
    if (isDynamicLinkAttributeFromField(attr)) {
      return `${singular}Doc.${attr.field}`;
    }
    return `"${attr}"`;
  }
  function getDefaultValueString(fIter: FieldIteration) {
    const { field, fName } = fIter;
    const prefix = `'${fName}':`;
    if (isTypeCount(field) || isTypeSum(field)) {
      return `${prefix}0`;
    }
    if (field === "serverTimestamp") {
      return `${prefix}DateTime.now()`;
    }
    if (isTypeDynamicLink(field)) {
      const { title, description, imageURL, isSuffixShort } = field;
      const titleString = title ? `title: ${getDLAttributeString(title)},` : "";
      const descString = description
        ? `description: ${getDLAttributeString(description)},`
        : "";
      const imgUrlString = imageURL
        ? `imageUrl: ${getDLAttributeString(imageURL)},`
        : "";
      const shortSuffix = isSuffixShort
        ? `isSuffixShort : ${isSuffixShort},`
        : "";

      return `${prefix}DynamicLinkField(
        ${titleString}
        ${descString}
        ${imgUrlString}
        ${shortSuffix})`;
    }
    return null;
  }
  const defaultValueMap = _(fields)
    .map((fIter) => getDefaultValueString(fIter))
    .compact()
    .map((x) => `${x},`)
    .join("");
  const dataMap = fields
    .map(({ fName, field }) => {
      const suffix = isTypeReference(field) ? `.toDataMap()` : "";
      return `'${fName}': ${singular}Doc.${fName}${suffix},`;
    })
    .join("");
  const firestoreCreateFields = creatableFields
    .map(({ fName }) => `'${fName}',`)
    .join("");
  const sums = _(colIterOf(schema))
    .map((colIter) =>
      fIterOf(colIter).map(function ({ fName: sumFName, field }) {
        if (isTypeSum(field) && field.collection === colName) {
          const refFieldName = field.reference;
          return `Sum(
          field: '${field.field}',
          sumDocCol: '${colNameOfRefFieldName(refFieldName)}',
          sumDocRef: ${singular}Doc.${refFieldName}.reference,
          sumField: '${sumFName}',),`;
        }
      })
    )
    .flatMap()
    .compact()
    .join("");

  function colNameOfRefFieldName(refFieldName: string) {
    const refField = col.fields[refFieldName] as ReferenceField;
    return refField.collection;
  }

  const counts = _(colIterOf(schema))
    .map((colIter) =>
      fIterOf(colIter).map(({ fName: countFName, field }) => {
        if (isTypeCount(field) && field.collection === colName) {
          const refFieldName = field.reference;
          return `Count(
          countDocCol: '${colNameOfRefFieldName(refFieldName)}',
          countDocRef: ${singular}Doc.${refFieldName}.reference,
          countField: '${countFName}',),`;
        }
      })
    )
    .flatMap()
    .compact()
    .join("");
  const shouldBeDeletedCondition = _(fields)
    .map(function ({ fName, field }) {
      if (
        (isTypeFloat(field) || isTypeInt(field)) &&
        !_.isNil(field.deleteDocWhen)
      ) {
        return `${singular}Doc.${fName} == ${field.deleteDocWhen}`;
      }
    })
    .compact()
    .join("&&");
  const shouldBeDeleted =
    shouldBeDeletedCondition !== "" ? shouldBeDeletedCondition : "false";
  const keys =
    schema.authentication?.userCollection === colName
      ? `${schema.authentication.uidField}`
      : col.keyFields
          ?.map((keyFName) => `${keyFName}.reference?.id,`)
          .join("") ?? "";

  function assignFromRef(fIter: {
    field: ReferenceField;
    fName: string;
    col: Collection;
    colName: string;
    schema: FlamestoreSchema;
  }) {
    return `${dataTypeString(fIter)}.from${pascalOfCol(fIter.field.collection)}(
            ${fIter.fName}:${fIter.fName})`;
  }

  const assignReference = _(fields)
    .map((fIter) =>
      isTypeReference(fIter.field)
        ? `${fIter.fName}= ${assignFromRef({
            ...fIter,
            field: fIter.field,
          })}`
        : null
    )
    .compact()
    .join(",");

  const copyWithParam = creatableFields
    .map(
      (fIter) =>
        `${
          isTypeReference(fIter.field)
            ? pascalOfCol(fIter.field.collection)
            : dataTypeString(fIter)
        } ${fIter.fName},`
    )
    .join("");
  const copyWithAssign = creatableFields
    .map((fIter) =>
      isTypeReference(fIter.field)
        ? `${fIter.fName}: ${fIter.fName} != null ? ${assignFromRef({
            ...fIter,
            field: fIter.field,
          })} : this.${fIter.fName},`
        : `${fIter.fName}: ${fIter.fName} ?? this.${fIter.fName},`
    )
    .join("");
  const finalAssignReference =
    assignReference === "" ? "" : `:${assignReference}`;
  return `

  ${referenceClasses}
  class ${pascal} extends Document {
    ${pascal}({
      ${creatableThisField}
    })${finalAssignReference};
    ${pascal}._({
      ${thisField}
    });
   ${finalField}
   ${pascal} copyWith({
     ${copyWithParam}
   }){
     return ${pascal}._(
      ${copyWithAssign}
     );
   }

   @override
   String get colName => "${colName}";

   @override
   List<String> get keys => [${keys}];
  }


  final ${pluralize.singular(
    colName
  )}Definition = DocumentDefinition<${pascal}>(
    mapToDoc: (data) =>
      ${pascal}._(
        ${fieldDataField}
      ),
    defaultValueMap: (doc){
      ${colDoc}
      return {
        ${defaultValueMap}
      };
    },
    docToMap:(doc){
      ${colDoc}
      return {
        ${dataMap}
      };
    },
    creatableFields:() => [
      ${firestoreCreateFields}
    ],
    sums:(doc){
      ${colDoc}
      return [
        ${sums}
      ];
    },
    counts:(doc) {
      ${colDoc}
      return [
        ${counts}
      ];
    },
    docShouldBeDeleted:(doc){
      ${colDoc}
      return ${shouldBeDeleted};
    },
  );
  `;
}

function dataTypeString({ fName, field, colName }: FieldIteration): string {
  if (isTypeString(field)) {
    return "String";
  }
  if (isTypeCount(field) || isTypeInt(field) || isTypeSum(field)) {
    return "int";
  }
  if (isTypeFloat(field)) {
    return "double";
  }
  if (isTypeReference(field)) {
    return `_${pascalOfCol(colName)}${getPascal(fName)}`;
  }
  if (field === "serverTimestamp") {
    return "DateTime";
  }
  if (isTypeComputed(field)) {
    if (field.compute === "float") {
      return "double";
    }
    if (field.compute === "int") {
      return "int";
    }
    if (field.compute === "path") {
      return "DocumentReference";
    }
    if (field.compute === "timestamp") {
      return "DateTime";
    }
    if (field.compute === "string") {
      return "String";
    }
  }
  if (isTypeDynamicLink(field)) {
    return "String";
  }
  console.log(field);
  throw Error();
}
