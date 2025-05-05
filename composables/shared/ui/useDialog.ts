import { ref } from 'vue';

import { DialogId, DialogInstance } from '~/types';

/**
 * Dialog store composable for managing dialog instances.
 * Provides methods to open, get, and close dialogs by ID.
 */
export const useDialogStore = () => {
  /**
   * Reactive array of all dialog instances.
   */
  const state = ref<Array<DialogInstance>>([]);

  /**
   * Opens a dialog with the given ID and optional data.
   * If the dialog is already open, does nothing.
   * @param dialogId - The unique identifier for the dialog.
   * @param data - Optional data to associate with the dialog.
   * @returns The dialog instance.
   */
  const open = <T>(dialogId: DialogId, data?: T): DialogInstance => {
    let dialog = state.value.find((instance: DialogInstance) => instance.dialogId === dialogId);
    if (!dialog) {
      dialog = {
        dialogId,
        isOpen: true,
        data
      };
      state.value.push(dialog);
    }
    return dialog;
  };

  /**
   * Retrieves the open dialog instance by its ID.
   * @param dialogId - The unique identifier for the dialog.
   * @returns The dialog instance if open, otherwise undefined.
   */
  const getDialog = (dialogId: DialogId): DialogInstance | undefined => {
    return state.value.find(
      (instance: DialogInstance) => instance.dialogId === dialogId && instance.isOpen
    );
  };

  /**
   * Closes the dialog with the given ID, if it is open.
   * @param dialogId - The unique identifier for the dialog.
   */
  const close = (dialogId: DialogId): void => {
    const idx = state.value.findIndex(
      (instance: DialogInstance) => instance.dialogId === dialogId && instance.isOpen
    );
    if (idx !== -1) state.value.splice(idx, 1);
  };

  return {
    state,
    open,
    getDialog,
    close
  };
};

/**
 * Singleton instance of the dialog store.
 */
export const dialogStore = useDialogStore();
