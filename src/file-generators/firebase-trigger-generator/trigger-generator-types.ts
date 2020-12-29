import { ArrayOr, CollectionIteration } from "../../type";

export const triggerTypes = ["Create", "Update", "Delete"] as const;
export type TriggerType = typeof triggerTypes[number];

export interface Trigger {
  colName: string;
  type: TriggerType;
  useDocData?: boolean;
  useContext?: boolean;
  header?: ArrayOr<string>;
  resultPromise?: ArrayOr<string>;
  updatedData?: ArrayOr<TriggerData>;
  nonUpdatedData?: ArrayOr<TriggerData>;
  docData?: ArrayOr<FieldTuple>;
  dependency?: ArrayOr<TriggerDependency>;
}

export interface ProcessedTrigger {
  useDocData: boolean;
  useContext: boolean;
  updatedData: TriggerData[];
  nonUpdatedData: TriggerData[];
  docData: FieldTuple[];
  resultCommits: string[];
  headerStrs: string[];
  dependencies: TriggerDependencyIteration[];
}

export interface FieldTuple {
  fName: string;
  value: string;
}

export interface TriggerData {
  dataName: string;
  field: ArrayOr<FieldTuple>;
}

interface _TriggerDependency {
  key: string;
  fName: string;
}

export interface TriggerDependency extends _TriggerDependency {
  colName: string;
}

export interface TriggerDependencyIteration extends _TriggerDependency {
  colIter: CollectionIteration;
}
