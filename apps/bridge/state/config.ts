import { createSelectorHooks } from "auto-zustand-selectors-hook";
import { Address } from "viem";
import { create } from "zustand";

import { BridgeNftDto, DeploymentDto } from "@/codegen/model";
import { MultiChainToken } from "@/types/token";

import { CustomTokenList } from "./settings";

interface ConfigState {
  deployment: DeploymentDto | null;
  setDeployment: (d: DeploymentDto | null) => void;

  withdrawing: boolean;
  toggleWithdrawing: () => void;

  displayWithdrawalModal: boolean;
  setDisplayWithdrawalModal: (x: boolean) => void;

  settingsModal: boolean;
  setSettingsModal: (x: boolean) => void;

  forceViaL1: boolean;
  toggleForceViaL1: () => void;
  setForceViaL1: (b: boolean) => void;

  easyMode: boolean;
  toggleEasyMode: () => void;
  setEasyMode: (b: boolean) => void;

  token: MultiChainToken | null;
  setToken: (token: MultiChainToken | null) => void;

  nft: BridgeNftDto | null;
  setNft: (n: BridgeNftDto | null) => void;

  rawAmount: string;
  setRawAmount: (raw: string) => void;

  recipientName: string;
  recipientAddress: Address | "";
  setRecipientName: (r: string) => void;
  setRecipientAddress: (r: Address | "") => void;

  displayTransactions: boolean;
  setDisplayTransactions: (b: boolean) => void;

  initialised: boolean;
  setInitialised: () => void;

  tokens: MultiChainToken[];
  setTokens: (tokens: MultiChainToken[]) => void;

  tokensImportedFromLists: string[];
  setTokensImportedFromLists: (s: string[]) => void;

  showCustomTokenListModal: true | CustomTokenList | false;
  setShowCustomTokenListModal: (b: true | CustomTokenList | false) => void;

  showCustomTokenImportModal: Address | false;
  setShowCustomTokenImportModal: (b: Address | false) => void;
}

const ConfigState = create<ConfigState>()((set) => ({
  deployment: null,
  setDeployment: (deployment) => set({ deployment }),

  withdrawing: false,
  toggleWithdrawing: () => set((s) => ({ withdrawing: !s.withdrawing })),

  forceViaL1: false,
  toggleForceViaL1: () => set((s) => ({ forceViaL1: !s.forceViaL1 })),
  setForceViaL1: (forceViaL1) => set({ forceViaL1 }),

  easyMode: false,
  toggleEasyMode: () => set((s) => ({ easyMode: !s.easyMode })),
  setEasyMode: (easyMode) => set({ easyMode }),

  token: null,
  setToken: (token) => set({ token, nft: null }),

  nft: null,
  setNft: (nft) => {
    set({ nft, token: null });
  },

  rawAmount: "",
  setRawAmount: (rawAmount) => set({ rawAmount }),

  recipientName: "",
  recipientAddress: "",
  setRecipientName: (recipientName) => set({ recipientName }),
  setRecipientAddress: (recipientAddress) => set({ recipientAddress }),

  displayTransactions: false,
  setDisplayTransactions: (displayTransactions) => set({ displayTransactions }),

  initialised: false,
  setInitialised: () => set({ initialised: true }),

  tokens: [],
  setTokens: (tokens) => set({ tokens }),

  tokensImportedFromLists: [],
  setTokensImportedFromLists: (tokensImportedFromLists) =>
    set({ tokensImportedFromLists }),

  settingsModal: false,
  setSettingsModal: (settingsModal) => set({ settingsModal }),

  showCustomTokenListModal: false,
  setShowCustomTokenListModal: (showCustomTokenListModal) =>
    set({ showCustomTokenListModal }),

  showCustomTokenImportModal: false,
  setShowCustomTokenImportModal: (showCustomTokenImportModal) =>
    set({ showCustomTokenImportModal }),

  displayWithdrawalModal: false,
  setDisplayWithdrawalModal: (displayWithdrawalModal) =>
    set({ displayWithdrawalModal }),
}));

export const useConfigState = createSelectorHooks(ConfigState);
