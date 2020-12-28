import { FieldIteration, ImageField } from "../../../type";
import { getImageMetadatas } from "../../util";
import { imageDataT, ownerRefIdT } from "../templates";
import { Trigger } from "../type";

export function imageTriggerGenerator(
  field: ImageField,
  fIter: FieldIteration
): Trigger[] {
  const { colName, fName, col } = fIter;
  const { ownerField } = col;
  if (!ownerField) throw Error("ownerField required for image upload");

  const id = ownerRefIdT({ ownerField });
  const metadatas = getImageMetadatas(field);
  return [
    {
      colName,
      triggerType: "Create",
      useThisData: true,
      thisData: {
        fName: fName,
        fValue: imageDataT({ colName, fName, id, metadatas }),
      },
    },
  ];
}
