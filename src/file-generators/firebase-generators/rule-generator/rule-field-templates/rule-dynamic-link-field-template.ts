import { DynamicLinkField } from "../../../generator-types";
import { t } from "../../../generator-utils";

export function getDynamicLinkValStr(
  field: DynamicLinkField,
  fName: string
): string[] {
  const { domains } = field;
  const validations = domains.map(
    (domain) => t`${fName}[0:${domain.length}] == '${domain}'`
  );
  return validations;
}
