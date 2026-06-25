import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

type EntityType =
  | 'tier'
  | 'event'
  | 'partner'
  | 'account'
  | 'currency'
  | 'currencyRate'
  | 'validationRule'
  | 'config'
  | 'campaign'
  | 'metadata'
  | 'category'
  | 'gameItem'
  | 'gameReward'
  | 'gamePool'
  | 'expiryPolicy'
  | 'redemptionPackage';

interface DialogState<T = any> {
  isOpen: boolean;
  entity: T | null;
}

interface CampaignDialogState<T = any> {
  isOpen: boolean;
  entity: T | null;
  step?: 'input' | 'confirm' | 'otp';
  amount?: number;
}

interface ChangePasswordDialogState {
  isOpen: boolean;
  step?: 'input' | 'otp';
}

interface DrawerState<T = any> {
  isOpen: boolean;
  entity: T | null;
}

interface UIState {
  deleteDialogs: Record<EntityType, DialogState>;
  drawers: Record<EntityType, DrawerState>;
  qrDialogs: Record<EntityType, DialogState>;
  addBudgetDialog: CampaignDialogState;
  changePasswordDialog: ChangePasswordDialogState;

  openDeleteDialog: <T>(entityType: EntityType, entity: T) => void;
  closeDeleteDialog: (entityType: EntityType) => void;
  openDrawer: <T>(entityType: EntityType, entity?: T) => void;
  closeDrawer: (entityType: EntityType) => void;
  openQRDialog: <T>(entityType: EntityType, entity: T) => void;
  closeQRDialog: (entityType: EntityType) => void;
  openAddBudgetDialog: <T>(entity: T) => void;
  closeAddBudgetDialog: () => void;
  setAddBudgetAmount: (amount: number) => void;
  setAddBudgetStep: (step: 'input' | 'confirm' | 'otp') => void;
  openChangePasswordDialog: () => void;
  closeChangePasswordDialog: () => void;
  setChangePasswordStep: (step: 'input' | 'otp') => void;
  reset: (entityType?: EntityType) => void;
}

const createInitialDialogState = (): DialogState => ({
  isOpen: false,
  entity: null,
});

const createInitialCampaignDialogState = (): CampaignDialogState => ({
  isOpen: false,
  entity: null,
  step: 'input',
  amount: 0,
});

const createInitialChangePasswordDialogState =
  (): ChangePasswordDialogState => ({
    isOpen: false,
    step: 'input',
  });

const createInitialDrawerState = (): DrawerState => ({
  isOpen: false,
  entity: null,
});

const initialState = {
  deleteDialogs: {
    tier: createInitialDialogState(),
    event: createInitialDialogState(),
    partner: createInitialDialogState(),
    task: createInitialDialogState(),
    taskCategory: createInitialDialogState(),
    account: createInitialDialogState(),
    currency: createInitialDialogState(),
    currencyRate: createInitialDialogState(),
    validationRule: createInitialDialogState(),
    config: createInitialDialogState(),
    campaign: createInitialDialogState(),
    metadata: createInitialDialogState(),
    category: createInitialDialogState(),
    gameItem: createInitialDialogState(),
    gameReward: createInitialDialogState(),
    gamePool: createInitialDialogState(),
    expiryPolicy: createInitialDialogState(),
    redemptionPackage: createInitialDialogState(),
  },
  drawers: {
    tier: createInitialDrawerState(),
    event: createInitialDrawerState(),
    partner: createInitialDrawerState(),
    task: createInitialDrawerState(),
    taskCategory: createInitialDrawerState(),
    account: createInitialDrawerState(),
    currency: createInitialDrawerState(),
    currencyRate: createInitialDrawerState(),
    validationRule: createInitialDrawerState(),
    config: createInitialDrawerState(),
    campaign: createInitialDrawerState(),
    metadata: createInitialDrawerState(),
    category: createInitialDrawerState(),
    gameItem: createInitialDrawerState(),
    gameReward: createInitialDrawerState(),
    gamePool: createInitialDrawerState(),
    expiryPolicy: createInitialDrawerState(),
    redemptionPackage: createInitialDrawerState(),
  },
  qrDialogs: {
    tier: createInitialDialogState(),
    event: createInitialDialogState(),
    partner: createInitialDialogState(),
    task: createInitialDialogState(),
    taskCategory: createInitialDialogState(),
    account: createInitialDialogState(),
    currency: createInitialDialogState(),
    currencyRate: createInitialDialogState(),
    validationRule: createInitialDialogState(),
    config: createInitialDialogState(),
    campaign: createInitialDialogState(),
    metadata: createInitialDialogState(),
    category: createInitialDialogState(),
    gameItem: createInitialDialogState(),
    gameReward: createInitialDialogState(),
    gamePool: createInitialDialogState(),
    expiryPolicy: createInitialDialogState(),
    redemptionPackage: createInitialDialogState(),
  },
  addBudgetDialog: createInitialCampaignDialogState(),
  changePasswordDialog: createInitialChangePasswordDialogState(),
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,

      openDeleteDialog: (entityType, entity) => {
        set((state) => ({
          deleteDialogs: {
            ...state.deleteDialogs,
            [entityType]: { isOpen: true, entity },
          },
        }));
      },

      closeDeleteDialog: (entityType) => {
        set((state) => ({
          deleteDialogs: {
            ...state.deleteDialogs,
            [entityType]: createInitialDialogState(),
          },
        }));
      },

      openDrawer: (entityType, entity) => {
        set((state) => ({
          drawers: {
            ...state.drawers,
            [entityType]: { isOpen: true, entity: entity || null },
          },
        }));
      },

      closeDrawer: (entityType) => {
        set((state) => ({
          drawers: {
            ...state.drawers,
            [entityType]: createInitialDrawerState(),
          },
        }));
      },

      openQRDialog: (entityType, entity) => {
        set((state) => ({
          qrDialogs: {
            ...state.qrDialogs,
            [entityType]: { isOpen: true, entity },
          },
        }));
      },

      closeQRDialog: (entityType) => {
        set((state) => ({
          qrDialogs: {
            ...state.qrDialogs,
            [entityType]: createInitialDialogState(),
          },
        }));
      },

      openAddBudgetDialog: (entity) => {
        set(() => ({
          addBudgetDialog: {
            isOpen: true,
            entity,
            step: 'input',
            amount: 0,
          },
        }));
      },

      closeAddBudgetDialog: () => {
        set(() => ({
          addBudgetDialog: createInitialCampaignDialogState(),
        }));
      },

      setAddBudgetAmount: (amount) => {
        set((state) => ({
          addBudgetDialog: { ...state.addBudgetDialog, amount },
        }));
      },

      setAddBudgetStep: (step) => {
        set((state) => ({
          addBudgetDialog: { ...state.addBudgetDialog, step },
        }));
      },

      openChangePasswordDialog: () => {
        set(() => ({
          changePasswordDialog: { isOpen: true, step: 'input' },
        }));
      },

      closeChangePasswordDialog: () => {
        set(() => ({
          changePasswordDialog: createInitialChangePasswordDialogState(),
        }));
      },

      setChangePasswordStep: (step) => {
        set((state) => ({
          changePasswordDialog: { ...state.changePasswordDialog, step },
        }));
      },

      reset: (entityType) => {
        if (entityType) {
          set((state) => ({
            deleteDialogs: {
              ...state.deleteDialogs,
              [entityType]: createInitialDialogState(),
            },
            drawers: {
              ...state.drawers,
              [entityType]: createInitialDrawerState(),
            },
            qrDialogs: {
              ...state.qrDialogs,
              [entityType]: createInitialDialogState(),
            },
          }));
        } else {
          set(initialState);
        }
      },
    }),
    { name: 'UIStore' },
  ),
);

export const useAccountDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.account.isOpen),
  );
  const account = useUIStore(
    useShallow((state) => state.deleteDialogs.account.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    account,
    open: (account: any) => openDeleteDialog('account', account),
    close: () => closeDeleteDialog('account'),
  };
};

export const useConfigDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.config.isOpen),
  );
  const config = useUIStore(
    useShallow((state) => state.deleteDialogs.config.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    config,
    open: (config: any) => openDeleteDialog('config', config),
    close: () => closeDeleteDialog('config'),
  };
};

export const useAccountDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.account.isOpen),
  );
  const account = useUIStore(
    useShallow((state) => state.drawers.account.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    account,
    open: (account?: any) => openDrawer('account', account),
    close: () => closeDrawer('account'),
  };
};

export const useConfigDrawer = () => {
  const isOpen = useUIStore(useShallow((state) => state.drawers.config.isOpen));
  const config = useUIStore(useShallow((state) => state.drawers.config.entity));
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    config,
    open: (config?: any) => openDrawer('config', config),
    close: () => closeDrawer('config'),
  };
};

export const useAccountQRDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.qrDialogs.account.isOpen),
  );
  const account = useUIStore(
    useShallow((state) => state.qrDialogs.account.entity),
  );
  const openQRDialog = useUIStore((state) => state.openQRDialog);
  const closeQRDialog = useUIStore((state) => state.closeQRDialog);

  return {
    isOpen,
    account,
    open: (account: any) => openQRDialog('account', account),
    close: () => closeQRDialog('account'),
  };
};

export const useChangePasswordDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.changePasswordDialog.isOpen),
  );
  const step = useUIStore(
    useShallow((state) => state.changePasswordDialog.step || 'input'),
  );
  const openChangePasswordDialog = useUIStore(
    (state) => state.openChangePasswordDialog,
  );
  const closeChangePasswordDialog = useUIStore(
    (state) => state.closeChangePasswordDialog,
  );
  const setChangePasswordStep = useUIStore(
    (state) => state.setChangePasswordStep,
  );

  return {
    isOpen,
    step,
    open: () => openChangePasswordDialog(),
    close: () => closeChangePasswordDialog(),
    setStep: (step: 'input' | 'otp') => setChangePasswordStep(step),
  };
};
