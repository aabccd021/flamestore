import { ArrayOr } from "../../type";

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

export interface FieldTuple {
  fName: string;
  fValue: string;
}

export interface TriggerData {
  dataName: string;
  field: ArrayOr<FieldTuple>;
}

export interface TriggerDependency {
  key: string;
  colName: string;
  promise: string;
}
