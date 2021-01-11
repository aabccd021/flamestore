import _ from "lodash";
import { pref } from "../../generator-utils";

export function indent(indent: number): (x: string) => string {
  return function _indent(x: string): string {
    return x
      .split("\n")
      .map(pref(_.repeat(" ", indent)))
      .join("\n");
  };
}
