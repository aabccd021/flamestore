import { Collection, ImageField } from "../../../type";
import { getImageMetadatas } from "../../utils";
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
