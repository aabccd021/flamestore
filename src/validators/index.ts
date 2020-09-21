import { Schema } from "../utils/interface";
import validateSyncFrom from "./sync-from-validator";
import validateSchema from "./schema-validator";
import validateSum from "./sum-validator";
import validateCount from "./count-validator";
import validateOwnerField from "./owner-field-validator";

export default function validate(rawSchema: any) {
  validateSchema(rawSchema);
  const schema: Schema = rawSchema;
  validateSyncFrom(schema);
  validateSum(schema);
  validateCount(schema);
  validateOwnerField(schema);
}