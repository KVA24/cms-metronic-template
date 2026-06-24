import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

// Generic types for different entities
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
  // Delete dialogs for each entity type
  deleteDialogs: Record<EntityType, DialogState>;

  // Drawers for each entity type
  drawers: Record<EntityType, DrawerState>;

  // QR dialogs (specific for account)
  qrDialogs: Record<EntityType, DialogState>;

  // Add Budget Dialog (separate from delete dialog)
  addBudgetDialog: CampaignDialogState;

  // Change Password Dialog
  changePasswordDialog: ChangePasswordDialogState;

  // Actions
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

const createInitialChangePasswordDialogState = (): ChangePasswordDialogState => ({
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
  },
  addBudgetDialog: createInitialCampaignDialogState(),
  changePasswordDialog: createInitialChangePasswordDialogState(),
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Open delete dialog for specific entity type
      openDeleteDialog: (entityType, entity) => {
        set((state) => ({
          deleteDialogs: {
            ...state.deleteDialogs,
            [entityType]: {
              isOpen: true,
              entity,
            },
          },
        }));
      },

      // Close delete dialog for specific entity type
      closeDeleteDialog: (entityType) => {
        set((state) => ({
          deleteDialogs: {
            ...state.deleteDialogs,
            [entityType]: createInitialDialogState(),
          },
        }));
      },

      // Open drawer for specific entity type
      openDrawer: (entityType, entity) => {
        set((state) => ({
          drawers: {
            ...state.drawers,
            [entityType]: {
              isOpen: true,
              entity: entity || null,
            },
          },
        }));
      },

      // Close drawer for specific entity type
      closeDrawer: (entityType) => {
        set((state) => ({
          drawers: {
            ...state.drawers,
            [entityType]: createInitialDrawerState(),
          },
        }));
      },

      // Open QR dialog for specific entity type
      openQRDialog: (entityType, entity) => {
        set((state) => ({
          qrDialogs: {
            ...state.qrDialogs,
            [entityType]: {
              isOpen: true,
              entity,
            },
          },
        }));
      },

      // Close QR dialog for specific entity type
      closeQRDialog: (entityType) => {
        set((state) => ({
          qrDialogs: {
            ...state.qrDialogs,
            [entityType]: createInitialDialogState(),
          },
        }));
      },

      // Open add budget dialog
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

      // Close add budget dialog
      closeAddBudgetDialog: () => {
        set(() => ({
          addBudgetDialog: createInitialCampaignDialogState(),
        }));
      },

      // Set add budget amount
      setAddBudgetAmount: (amount) => {
        set((state) => ({
          addBudgetDialog: {
            ...state.addBudgetDialog,
            amount,
          },
        }));
      },

      // Set add budget step
      setAddBudgetStep: (step) => {
        set((state) => ({
          addBudgetDialog: {
            ...state.addBudgetDialog,
            step,
          },
        }));
      },

      // Open change password dialog
      openChangePasswordDialog: () => {
        set(() => ({
          changePasswordDialog: {
            isOpen: true,
            step: 'input',
          },
        }));
      },

      // Close change password dialog
      closeChangePasswordDialog: () => {
        set(() => ({
          changePasswordDialog: createInitialChangePasswordDialogState(),
        }));
      },

      // Set change password step
      setChangePasswordStep: (step) => {
        set((state) => ({
          changePasswordDialog: {
            ...state.changePasswordDialog,
            step,
          },
        }));
      },

      // Reset specific entity type or all
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
    {
      name: 'UIStore',
    },
  ),
);

// Selector hooks for each entity type - Delete Dialog
export const useTierDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.tier.isOpen),
  );
  const tier = useUIStore(
    useShallow((state) => state.deleteDialogs.tier.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    tier,
    open: (tier: any) => openDeleteDialog('tier', tier),
    close: () => closeDeleteDialog('tier'),
  };
};

export const useEventDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.event.isOpen),
  );
  const event = useUIStore(
    useShallow((state) => state.deleteDialogs.event.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    event,
    open: (event: any) => openDeleteDialog('event', event),
    close: () => closeDeleteDialog('event'),
  };
};

export const usePartnerDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.partner.isOpen),
  );
  const partner = useUIStore(
    useShallow((state) => state.deleteDialogs.partner.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    partner,
    open: (partner: any) => openDeleteDialog('partner', partner),
    close: () => closeDeleteDialog('partner'),
  };
};

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

export const useCurrencyDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.currency.isOpen),
  );
  const currency = useUIStore(
    useShallow((state) => state.deleteDialogs.currency.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    currency,
    open: (currency: any) => openDeleteDialog('currency', currency),
    close: () => closeDeleteDialog('currency'),
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

export const useCampaignDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.campaign.isOpen),
  );
  const campaign = useUIStore(
    useShallow((state) => state.deleteDialogs.campaign.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    campaign,
    open: (campaign: any) => openDeleteDialog('campaign', campaign),
    close: () => closeDeleteDialog('campaign'),
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

export const useCurrencyDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.currency.isOpen),
  );
  const currency = useUIStore(
    useShallow((state) => state.drawers.currency.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    currency,
    open: (currency?: any) => openDrawer('currency', currency),
    close: () => closeDrawer('currency'),
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

// QR Dialog selector (for account)
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

export const useCurrencyRateDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.currencyRate.isOpen),
  );
  const currencyRate = useUIStore(
    useShallow((state) => state.deleteDialogs.currencyRate.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    currencyRate,
    open: (currencyRate: any) => openDeleteDialog('currencyRate', currencyRate),
    close: () => closeDeleteDialog('currencyRate'),
  };
};

export const useCurrencyRateDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.currencyRate.isOpen),
  );
  const currencyRate = useUIStore(
    useShallow((state) => state.drawers.currencyRate.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    currencyRate,
    open: (currencyRate?: any) => openDrawer('currencyRate', currencyRate),
    close: () => closeDrawer('currencyRate'),
  };
};

export const useValidationRuleDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.validationRule.isOpen),
  );
  const validationRule = useUIStore(
    useShallow((state) => state.deleteDialogs.validationRule.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    validationRule,
    open: (validationRule: any) =>
      openDeleteDialog('validationRule', validationRule),
    close: () => closeDeleteDialog('validationRule'),
  };
};

export const useValidationRuleDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.validationRule.isOpen),
  );
  const validationRule = useUIStore(
    useShallow((state) => state.drawers.validationRule.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    validationRule,
    open: (validationRule?: any) =>
      openDrawer('validationRule', validationRule),
    close: () => closeDrawer('validationRule'),
  };
};

export const useMetadataDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.metadata.isOpen),
  );
  const schema = useUIStore(
    useShallow((state) => state.deleteDialogs.metadata.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    schema,
    open: (schema: any) => openDeleteDialog('metadata', schema),
    close: () => closeDeleteDialog('metadata'),
  };
};

export const useCategoryDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.category.isOpen),
  );
  const category = useUIStore(
    useShallow((state) => state.deleteDialogs.category.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    category,
    open: (category: any) => openDeleteDialog('category', category),
    close: () => closeDeleteDialog('category'),
  };
};

export const useCategoryDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.category.isOpen),
  );
  const category = useUIStore(
    useShallow((state) => state.drawers.category.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    category,
    open: (category?: any) => openDrawer('category', category),
    close: () => closeDrawer('category'),
  };
};

export const useGameItemDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.gameItem.isOpen),
  );
  const gameItem = useUIStore(
    useShallow((state) => state.deleteDialogs.gameItem.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    gameItem,
    open: (gameItem: any) => openDeleteDialog('gameItem', gameItem),
    close: () => closeDeleteDialog('gameItem'),
  };
};

export const useGameItemDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.gameItem.isOpen),
  );
  const gameItem = useUIStore(
    useShallow((state) => state.drawers.gameItem.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    gameItem,
    open: (gameItem?: any) => openDrawer('gameItem', gameItem),
    close: () => closeDrawer('gameItem'),
  };
};

export const useGameRewardDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.gameReward.isOpen),
  );
  const gameReward = useUIStore(
    useShallow((state) => state.deleteDialogs.gameReward.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    gameReward,
    open: (gameReward: any) => openDeleteDialog('gameReward', gameReward),
    close: () => closeDeleteDialog('gameReward'),
  };
};

export const useGameRewardDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.gameReward.isOpen),
  );
  const gameReward = useUIStore(
    useShallow((state) => state.drawers.gameReward.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    gameReward,
    open: (gameReward?: any) => openDrawer('gameReward', gameReward),
    close: () => closeDrawer('gameReward'),
  };
};

export const useGamePoolDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.gamePool.isOpen),
  );
  const gamePool = useUIStore(
    useShallow((state) => state.deleteDialogs.gamePool.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    gamePool,
    open: (gamePool: any) => openDeleteDialog('gamePool', gamePool),
    close: () => closeDeleteDialog('gamePool'),
  };
};

export const useGamePoolDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.gamePool.isOpen),
  );
  const gamePool = useUIStore(
    useShallow((state) => state.drawers.gamePool.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    gamePool,
    open: (gamePool?: any) => openDrawer('gamePool', gamePool),
    close: () => closeDrawer('gamePool'),
  };
};

// Add Budget Dialog selector (for campaign)
export const useAddBudgetDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.addBudgetDialog.isOpen),
  );
  const campaign = useUIStore(
    useShallow((state) => state.addBudgetDialog.entity),
  );
  const step = useUIStore(
    useShallow((state) => state.addBudgetDialog.step || 'input'),
  );
  const amount = useUIStore(
    useShallow((state) => state.addBudgetDialog.amount || 0),
  );
  const openAddBudgetDialog = useUIStore((state) => state.openAddBudgetDialog);
  const closeAddBudgetDialog = useUIStore(
    (state) => state.closeAddBudgetDialog,
  );
  const setAddBudgetAmount = useUIStore((state) => state.setAddBudgetAmount);
  const setAddBudgetStep = useUIStore((state) => state.setAddBudgetStep);

  return {
    isOpen,
    campaign,
    step,
    amount,
    open: (campaign: any) => openAddBudgetDialog(campaign),
    close: () => closeAddBudgetDialog(),
    setAmount: (amount: number) => setAddBudgetAmount(amount),
    setStep: (step: 'input' | 'confirm' | 'otp') => setAddBudgetStep(step),
  };
};

export const useExpiryPolicyDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.expiryPolicy.isOpen),
  );
  const expiryPolicy = useUIStore(
    useShallow((state) => state.deleteDialogs.expiryPolicy.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    expiryPolicy,
    open: (expiryPolicy: any) => openDeleteDialog('expiryPolicy', expiryPolicy),
    close: () => closeDeleteDialog('expiryPolicy'),
  };
};

export const useExpiryPolicyDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.expiryPolicy.isOpen),
  );
  const expiryPolicy = useUIStore(
    useShallow((state) => state.drawers.expiryPolicy.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    expiryPolicy,
    open: (expiryPolicy?: any) => openDrawer('expiryPolicy', expiryPolicy),
    close: () => closeDrawer('expiryPolicy'),
  };
};

// Change Password Dialog selector
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

export const useRedemptionPackageDeleteDialog = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.deleteDialogs.redemptionPackage.isOpen),
  );
  const redemptionPackage = useUIStore(
    useShallow((state) => state.deleteDialogs.redemptionPackage.entity),
  );
  const openDeleteDialog = useUIStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useUIStore((state) => state.closeDeleteDialog);

  return {
    isOpen,
    redemptionPackage,
    open: (redemptionPackage: any) =>
      openDeleteDialog('redemptionPackage', redemptionPackage),
    close: () => closeDeleteDialog('redemptionPackage'),
  };
};

export const useRedemptionPackageDrawer = () => {
  const isOpen = useUIStore(
    useShallow((state) => state.drawers.redemptionPackage.isOpen),
  );
  const redemptionPackage = useUIStore(
    useShallow((state) => state.drawers.redemptionPackage.entity),
  );
  const openDrawer = useUIStore((state) => state.openDrawer);
  const closeDrawer = useUIStore((state) => state.closeDrawer);

  return {
    isOpen,
    redemptionPackage,
    open: (redemptionPackage?: any) =>
      openDrawer('redemptionPackage', redemptionPackage),
    close: () => closeDrawer('redemptionPackage'),
  };
};
