import { FieldIteration, ImageField } from "../../../type";
import { getImageMetadatas } from "../../util";
import { imageDataStr } from "../constants";
import { getOwnerRefIdStr } from "../templates";
import { Trigger } from "../type";

export function imageTriggerGenerator(
  field: ImageField,
  fIter: FieldIteration
): Trigger[] {
  const { colName, fName, col } = fIter;
  const { ownerField } = col;

  if (!ownerField) throw Error("ownerField required to upload image");

  const id = getOwnerRefIdStr({ ownerField });
  const metadatasStr = getImageMetadatas(field).map((x) => `"${x}"`);
  const imageDataCallStr =
    `await ${imageDataStr}` +
    `("${colName}","${fName}",${id},[${metadatasStr}],snapshot)`;

  return [
    {
      colName,
      type: "Create",
      useDocData: true,
      docData: { fName: fName, fValue: imageDataCallStr },
    },
  ];
}
