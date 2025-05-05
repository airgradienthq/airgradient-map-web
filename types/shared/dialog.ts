export interface DialogInstance {
  dialogId: DialogId;
  isOpen: boolean;
  data: unknown;
}

export enum DialogId {
  SAMPLE = 'sample'
}
