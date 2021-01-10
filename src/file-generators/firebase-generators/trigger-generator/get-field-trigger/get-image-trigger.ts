import { Collection, ImageField } from "../../../generator-types";
import { t } from "../../../generator-utils";
import {
  getImageDataStr,
  getOwnerRefIdStr,
} from "../trigger-generator-templates";
import { Trigger } from "../trigger-generator-types";

export function getImageTrigger(
  field: ImageField,
  { fName, colName, col }: { fName: string; colName: string; col: Collection }
): Trigger[] {
  const { ownerField } = col;
  if (!ownerField) throw Error("ownerField required to upload image");

  const idStr = getOwnerRefIdStr(ownerField);
  const metadatasStr = field.metadatas.map((x) => t`"${x}"`).join(",");
  const imageDataStr = getImageDataStr(
    t`"${colName}"`,
    t`"${fName}"`,
    idStr,
    t`[${metadatasStr}]`,
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
  return t`await ${imageDataStr}`;
}
