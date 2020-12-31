import { Collection, ImageField } from "../../../types";
import {
  getImageDataStr,
  getOwnerRefIdStr,
} from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getImageTrigger(
  field: ImageField,
  { fName, colName, col }: { fName: string; colName: string; col: Collection }
): Trigger[] {
  const { ownerFieldName: ownerField } = col;
  if (!ownerField) throw Error("ownerField required to upload image");

  const idStr = getOwnerRefIdStr({ ownerField });
  const metadatasStr = field.metadatas.map((x) => `"${x}"`);
  const imageDataStr = getImageDataStr(
    `"${colName}"`,
    `"${fName}"`,
    idStr,
    `[${metadatasStr}]`,
    "snapshot"
  );
  const imageDataCallStr = getImageDataCallStr({ imageDataStr });
  return [
    {
      colName,
      type: "Create",
      useDocData: true,
      docData: { fName, fValue: imageDataCallStr },
    },
  ];
}

function getImageDataCallStr(param: { imageDataStr: string }): string {
  const { imageDataStr } = param;
  return `await ${imageDataStr}`;
}
