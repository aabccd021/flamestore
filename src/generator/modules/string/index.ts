import { FlamestoreModule } from "../../module";
import { Collection, Field } from "../../schema";

export const module: FlamestoreModule = {
  getRule: rule,
}


function rule(fieldName: string, field: Field): string[] {
  let content = [];
  if (field?.type?.string) {
    const maxLength = field.type.string?.maxLength;
    if (maxLength || maxLength === 0) {
      content.push(`${fieldName}.size() <= ${maxLength}`);
    }
    const minLength = field.type.string?.minLength;
    if (minLength || minLength === 0) {
      content.push(`${fieldName}.size() >= ${minLength}`);
    }
  }
  return content;
}