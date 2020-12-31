import { ArrayOr } from "../../../types";

export const triggerTypes = ["Create", "Update", "Delete"] as const;
export type TriggerType = typeof triggerTypes[number];

export type Trigger = Readonly<{
  colName: string;
  type: TriggerType;
  useDocData?: boolean;
  useContext?: boolean;
  header?: ArrayOr<string>;
  resultPromise?: ArrayOr<string>;
  updatedData?: ArrayOr<SchemaTriggerData>;
  nonUpdatedData?: ArrayOr<SchemaTriggerData>;
  docData?: ArrayOr<FieldTuple>;
  dependency?: ArrayOr<TriggerDependency>;
}>;

export type ProcessedTrigger = Readonly<{
  useDocData: boolean;
  useContext: boolean;
  updatedData: TriggerData[];
  nonUpdatedData: TriggerData[];
  docData: FieldTuple[];
  resultCommits: string[];
  headerStrs: string[];
  dependencies: TriggerDependency[];
}>;

export type FieldTuple = Readonly<{
  fName: string;
  fValue: string;
}>;

export type SchemaTriggerData = Readonly<{
  dataName: string;
  field: ArrayOr<FieldTuple>;
}>;
export type TriggerData = Readonly<{
  dataName: string;
  fields: FieldTuple[];
}>;

export type TriggerDependency = Readonly<{
  key: string;
  fName: string;
  colName: string;
}>;
