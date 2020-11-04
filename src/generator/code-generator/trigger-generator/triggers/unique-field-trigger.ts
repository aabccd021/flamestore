import { FlamestoreSchema, Collection, Field } from "../../../types/schema";
import { getPascalCollectionName as pascalOf } from "../../generator-util";
import { TriggerMap } from "../interface";

export function uniqueFieldTriggerGenerator(
  triggerMap: TriggerMap,
  collectionName: string,
  _: Collection,
  fieldName: string,
  field: Field,
): TriggerMap {
  if (field.isUnique) {
    triggerMap[collectionName].createTrigger.addHeader(
      `if (await foundDuplicate('${collectionName}','${fieldName}', snapshot, context)) return;\n\n`
    );

    triggerMap[collectionName].updateTrigger.addHeader(
      `if (await foundDuplicate('${collectionName}','${fieldName}', change, context)) return;\n\n`
    );
  }
  return triggerMap;
}
