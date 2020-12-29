import { Trigger } from "../../../generators/trigger-generator/types";
import { FieldIteration, ImageField } from "../../../type";
import { getImageMetadatas } from "../../util";
import { getImageDataStr, getOwnerRefIdStr } from "../templates";

export function imageTriggerGenerator(
  field: ImageField,
  fIter: FieldIteration
): Trigger[] {
  const { colName, fName, col } = fIter;
  const { ownerField } = col;

  if (!ownerField) throw Error("ownerField required to upload image");

  const id = getOwnerRefIdStr({ ownerField });
  const metadatasStr = getImageMetadatas(field).map((x) => `"${x}"`);
  const imageDataCallStr = getImageDataStr(
    `"${colName}"`,
    `"${fName}"`,
    id,
    `[${metadatasStr}]`,
    "snapshot"
  );

  return [
    {
      colName,
      type: "Create",
      useDocData: true,
      docData: {
        fName,
        value: `await ${imageDataCallStr}`,
      },
    },
  ];
}
