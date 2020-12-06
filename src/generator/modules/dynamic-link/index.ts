import { Collection, Field, FieldTypes, FlamestoreModule, FlamestoreSchema } from "../../../type";
import { getDynamicLinkDomain, isDynamicLinkAttributeFromField, isTypeDynamicLink } from "../../util";

export const module: FlamestoreModule = {
  isCreatable: (field: Field) => isTypeDynamicLink(field.type),
  // isUpdatableOverride: (field: Field) => (isTypeString(field.type) && field.type.string.type === "dynamicLinkURL") ? false : undefined,
  // triggerGenerator
  getRule,
  validate,
}

function validate(schema: FlamestoreSchema) {
  Object.entries(schema.collections).forEach(([collectionName, collection]) => {
    Object.entries(collection.fields).forEach(([fieldName, field]) => {
      const type = field.type;
      if (isTypeDynamicLink(type)) {
        const dl = type.dynamicLink;
        Object.values([
          ['title', dl.title],
          ['description', dl.description],
          ['imageURL', dl.imageURL],
        ]).forEach(([attrName, attr]) => {
          if (isDynamicLinkAttributeFromField(attr)) {
            if (!Object.keys(collection.fields).includes(attr.field)) {
              throw Error(
                `Error on schema.collections.${collectionName}.fields.${fieldName}` +
                `.type.dynamicLink.${attrName}.field: Field ${attr.field} does not` +
                ` exists on collection ${collectionName}`
              );
            }
          }
        });
      }
    });
  });
}

function getRule(
  fieldName: string,
  field: Field,
  _: string,
  __: Collection,
  schema: FlamestoreSchema,
) {
  let content: string[] = [];
  const fieldType = field.type;
  if (isTypeDynamicLink(fieldType)) {
    content.push(`${fieldName} is ${FieldTypes.STRING}`)
    const projects = schema.configuration.project;
    const prefixIsValidArray = Object.entries(projects)
      .map(([projectName, project]) => `https://${getDynamicLinkDomain(projectName, project)}/`)
      .map(domain => `${fieldName}[0:${domain.length}] == '${domain}'`)
    const prefixIsValid = prefixIsValidArray.length == 1 ? prefixIsValidArray[0] : `(${prefixIsValidArray.join('||')})`
    content.push(prefixIsValid);
  }
  return content;
}

// function triggerGenerator(
//   triggerMap: TriggerMap,
//   collectionName: string,
//   collection: Collection,
//   fieldName: string,
//   field: Field,
// ): TriggerMap {
//   const fieldType = field.type;
//   if (isTypeString(fieldType)) {
//     if (fieldType.string.type === 'dynamicLinkURL') {
//       const defaults = collection?.dynamicLinkDefaults;
//       var title;
//       var description;
//       var imageUrl;
//       Object.entries(collection.fields).forEach(([dlFieldName, dlField]) => {
//         if (isTypeString(dlField.type)) {
//           const stringType = dlField.type.string.type;
//           if (stringType === "dynamicLinkTitle") {
//             title = `data.${dlFieldName}`;
//           }
//           if (stringType === "dynamicLinkImageURL") {
//             imageUrl = `data.${dlFieldName}`;
//           }
//           if (stringType === "dynamicLinkDescription") {
//             description = `data.${dlFieldName}`;
//           }
//         }
//       });
//       title = title ?? (defaults?.title ? `"${defaults.title}"` : "undefined");
//       description = description ?? (defaults?.description ? `"${defaults.description}"` : "undefined");
//       imageUrl = imageUrl ?? (defaults?.imageURL ? `"${defaults?.imageURL}"` : "undefined");
//       triggerMap[collectionName].createTrigger.addContent(
//         `await createDynamicLink(
//           "${collectionName}",
//           context.params.documentId,
//           ${title},
//           ${description},
//           ${imageUrl},
//           );`
//       );
//     }
//   }
//   return triggerMap;
// }