export const triggerTypes = ["Create", "Update", "Delete"] as const;
export type TriggerType = typeof triggerTypes[number];

export type Trigger = {
  colName: string;
  triggerType: TriggerType;
  useThisData?: boolean;
  useContext?: boolean;
  header?: string[];
  resultPromises?: string[];
  dependencies?: {
    key: string;
    colName: string;
    promise: string;
  }[];
  thisData?: {
    fName: string;
    fValue: string;
  }[];
  data?: TriggerData[];
  nonUpdateData?: TriggerData[];
};

export interface TriggerData {
  dataName: string;
  fName: string;
  fValue: string;
}
