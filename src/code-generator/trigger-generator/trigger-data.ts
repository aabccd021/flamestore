export default class TriggerData {
  _header = '';
  dependencyPromises: { [dependencyName: string]: { collection: string, promise: string } } = {};
  _resultPromises = '';
  _data: UpdateData = {};
  _nonUpdateData: UpdateData = {};

  addData(dataName: string, fieldName: string, fieldValue: string, fieldCondition?: string) {
    if (!Object.keys(this._data).includes(dataName)) {
      this._data[dataName] = {};
    }
    this._data[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addNonUpdateData(dataName: string, fieldName: string, fieldValue: string, fieldCondition?: string) {
    if (!Object.keys(this._nonUpdateData).includes(dataName)) {
      this._nonUpdateData[dataName] = {};
    }
    this._nonUpdateData[dataName][fieldName] = { fieldValue, fieldCondition };
  }
  addHeader(content: string) {
    if (!this._header.includes(content)) {
      this._header += content;
    }
  }
  addResultPromise(content: string) {
    if (!this._resultPromises.includes(content)) {
      this._resultPromises += content;
    }
  }
  isEmpty(): boolean {
    return this._header === ''
      && Object.keys(this.dependencyPromises).length === 0
      && this._resultPromises === ''
      && Object.keys(this._data).length === 0
      && Object.keys(this._nonUpdateData).length === 0;
  }
}

export interface UpdateData {
  [dataName: string]: UpdateFieldData;
}

export interface UpdateFieldData {
  [fieldName: string]: { fieldValue: string, fieldCondition?: string }
}