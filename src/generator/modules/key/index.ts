import _ from "lodash";
import { FlamestoreModule } from "../../type";

export const module: FlamestoreModule = {
  isNotUpdatable: ({ fName, schema, colName, col }) => {
    return (
      ((schema.authentication?.userCollection === colName &&
        schema.authentication.uidField === fName) ||
        col.keyFields?.includes(fName)) ??
      false
    );
  },

  ruleFunction({ colName, col, schema }) {
    const keyFields = col.keyFields ?? [];
    if (schema.authentication?.userCollection === colName) {
      keyFields.push(schema.authentication.uidField);
    }
    return _.values(keyFields).map(
      (fName, counter) =>
        `      function ${fName}OfDocumentId(){
        return documentId.split('_')[${counter}];
      }`
    );
  },

  getRule({ fName, col, schema, colName }) {
    const rules: string[] = [];
    if (col.keyFields?.includes(fName) ?? false) {
      rules.push(`get(${fName}.reference).id == ${fName}OfDocumentId()`);
    }
    if (
      schema.authentication?.userCollection === colName &&
      schema.authentication.uidField === fName
    ) {
      rules.push(`${fName} == ${fName}OfDocumentId()`);
    }
    return rules;
  },
};
