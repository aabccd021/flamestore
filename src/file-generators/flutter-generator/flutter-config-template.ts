import _ from "lodash";
import { ProjectConfiguration } from "../..";
import { t, toPascalColName as toPascalCol } from "../generator-utils";

export function getConfigStr(
  names: string[],
  project: { [name: string]: ProjectConfiguration }
): string {
  const projectsStr = _(project).map(toProjectStr);
  const colMapStr = names.map((x) => t`${toPascalCol(x)}:'${x}',`);
  const docDefStr = names.map((x) => t`'${x}':${toPascalCol(x)}Definition,`);
  return t`final config = FlamestoreConfig(
    projects: {${projectsStr}},
    collectionClassMap: {${colMapStr}},
    documentDefinitions: {${docDefStr}},
  );`;
}

function toProjectStr(config: ProjectConfiguration, name: string): string {
  const {
    dynamicLinkDomain: dlDomain,
    androidPackageName: androidPN,
    domain,
  } = config;
  const dlStr = emptyOr(dlDomain, (x) => t`dynamicLinkDomain:'${x}',`);
  const androidStr = emptyOr(androidPN, (x) => t`androidPackageName:'${x}',`);
  const domainStr = emptyOr(domain, (x) => t`domain: '${x}',`);
  return t`'${name}':ProjectConfig(${dlStr}${androidStr}${domainStr}),`;
}

function emptyOr(str: string | undefined, fn: (str: string) => string): string {
  if (!str) return "";
  return fn(str);
}
