import * as fs from 'fs';
import { FlamestoreModule } from '../../module';
import { FlamestoreSchema } from '../../schema';
import collectionRuleTemplate from "./collection-rule-generator";

export default function generateRule(
  schema: FlamestoreSchema,
  outputFilePath: string,
  modules: FlamestoreModule[],
) {
  const collectionsRule =
    Object.entries(schema.collections)
      .map(([collectionName, collection]) =>
        collectionRuleTemplate(collectionName, collection, schema, modules))
      .join('\n');
  fs.writeFileSync(outputFilePath, ruleTemplate(collectionsRule));
}

function ruleTemplate(collectionsRule: string) {
  return `rules_version = '2';
service cloud.firestore {

  match /databases/{database}/documents {
    function isAuthenticated(){
      return request.auth != null;
    }
    function reqData(){
      return request.resource.data;
    }
    function resData(){
      return resource.data;
    }
    function isNotDeleted(fieldName){
      return fieldName in reqData() && fieldName in resData();
    }
    function updatedKeys(){
      return reqData().diff(resData()).affectedKeys();
    }
${collectionsRule}
  }
}`;
}