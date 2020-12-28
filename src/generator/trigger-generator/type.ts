import { ArrayOr } from "../../type";

export const triggerTypes = ["Create", "Update", "Delete"] as const;
export type TriggerType = typeof triggerTypes[number];

export type Trigger = {
  colName: string;
  triggerType: TriggerType;
  useThisData?: boolean;
  useContext?: boolean;
  header?: ArrayOr<string>;
  resultPromises?: ArrayOr<string>;
  data?: ArrayOr<TriggerData>;
  nonUpdateData?: ArrayOr<TriggerData>;
  thisData?: ArrayOr<FieldTuple>;
  dependencies?: ArrayOr<TriggerDependency>;
};

export interface FieldTuple {
  fName: string;
  fValue: string;
}

export interface TriggerData {
  dataName: string;
  fields: FieldTuple[];
}

export interface TriggerDependency {
  key: string;
  colName: string;
  promise: string;
}
