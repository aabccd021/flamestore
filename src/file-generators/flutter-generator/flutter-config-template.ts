import _ from "lodash";
import { ProjectConfiguration } from "../..";
import { t, toPascalColName } from "../generator-utils";

export function getConfigStr(
  names: string[],
  project: { [name: string]: ProjectConfiguration }
): string {
  const projectsStr = _(project).map(toProjectStr).join("");
  const colMapStr = names.map((x) => t`${toPascalColName(x)}:'${x}',`).join("");
  const docDefStr = names
    .map((x) => t`'${x}':${toPascalColName(x)}Definition,`)
    .join("");
  return t`final config = FlamestoreConfig(
    projects: {${projectsStr}},
    collectionClassMap: {${colMapStr}},
    documentDefinitions: {${docDefStr}},
  );`;
}

function toProjectStr(config: ProjectConfiguration, name: string): string {
  const { dynamicLinkDomain, androidPackageName, domain } = config;
  const dlStr = emptyOr(dynamicLinkDomain, (x) => t`dynamicLinkDomain:'${x}',`);
  const androidStr = emptyOr(
    androidPackageName,
    (x) => t`androidPackageName:'${x}',`
  );
  const domainStr = emptyOr(domain, (x) => t`domain: '${x}',`);
  return t`'${name}':ProjectConfig(${dlStr}${androidStr}${domainStr}),`;
}

function emptyOr(str: string | undefined, fn: (str: string) => string): string {
  if (!str) return "";
  return fn(str);
}
