import { CollectionEntry } from "../../generator-types";
import { pref, t } from "../../generator-utils";
import { toCollectionRuleStr } from "./rule-generator-collection-template";
import { indent } from "./rule-generator-utils";

export function getRuleStr(colEntries: CollectionEntry[]): string {
  const colRuleStr = colEntries
    .map(toCollectionRuleStr)
    .map(indent(4))
    .map(pref("\n"));
  // TODO: remove emty line
  return t`rules_version = '2';
service cloud.firestore {

  match /databases/{database}/documents {
    function isAuthenticated(){ return request.auth != null; }
    function reqData(){ return request.resource.data; }
    function resData(){ return resource.data; }
    function updatedKeys(){ return reqData().diff(resData()).affectedKeys(); }
    function isNotDeleted(fieldName){
      return fieldName in reqData() && fieldName in resData();
    }${colRuleStr}
  }
}`;
}
