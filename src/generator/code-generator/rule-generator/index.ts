import * as fs from 'fs';
import { FlamestoreSchema } from '../../schema';
import collectionRuleTemplate from "./collection-rule-generator";

export default function generateRule(schema: FlamestoreSchema, outputFilePath: string) {
  const ruleContent = getRuleContent(schema);
  fs.writeFileSync(outputFilePath, ruleContent);
}

function getRuleContent(schema: FlamestoreSchema): string {
  const collectionsRule: string[] = [];
  for (const [collectionName, collection] of Object.entries(schema.collections)) {
    const collectionRule = collectionRuleTemplate(collectionName, collection, schema);
    collectionsRule.push(collectionRule);
  }
  return ruleTemplate(collectionsRule.join('\n'));
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