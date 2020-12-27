import { FieldIteration, ImageField } from "../../../type";
import { getImageMetadatas } from "../../util";
import { Trigger } from "../type";

export function imageTriggerGenerator(
  field: ImageField,
  fIter: FieldIteration
): Trigger[] {
  const { colName, fName, col } = fIter;
  const value = `
    await imageDataOf(
      "${colName}",
      "${fName}",
      data.${col.ownerField}.reference.id,
      [${getImageMetadatas(field).map((x) => `"${x}"`)}],
      snapshot,
    )`;
  return [
    {
      colName,
      triggerType: "Create",
      useThisData: true,
      thisData: [
        {
          fName: fName,
          fValue: value,
        },
      ],
    },
  ];
}
