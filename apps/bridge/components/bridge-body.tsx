import { useConnectModal } from "@rainbow-me/rainbowkit";
import { waitForTransaction } from "@wagmi/core";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isPresent } from "ts-is-present";
import { P, match } from "ts-pattern";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useBalance, useFeeData, useWalletClient } from "wagmi";

import { useBridgeControllerTrack } from "@/codegen";
import { DeploymentType } from "@/codegen/model";
import { deploymentTheme } from "@/config/theme";
import { currencySymbolMap } from "@/constants/currency-symbol-map";
import { useAllowance } from "@/hooks/use-allowance";
import { useAllowanceNft } from "@/hooks/use-allowance-nft";
import { useApprove } from "@/hooks/use-approve";
import { useApproveNft } from "@/hooks/use-approve-nft";
import { useTokenBalance } from "@/hooks/use-balances";
import { useBridge } from "@/hooks/use-bridge";
import { useBridgeFee } from "@/hooks/use-bridge-fee";
import { useFromChain, useToChain } from "@/hooks/use-chain";
import { useIsContractAccount } from "@/hooks/use-is-contract-account";
import { useNativeToken } from "@/hooks/use-native-token";
import { useTokenPrice } from "@/hooks/use-prices";
import { useSelectedToken } from "@/hooks/use-selected-token";
import { useSwitchChain } from "@/hooks/use-switch-chain";
import { useActiveTokens } from "@/hooks/use-tokens";
import { useTransferTime } from "@/hooks/use-transfer-time";
import { useWeiAmount } from "@/hooks/use-wei-amount";
import { useConfigState } from "@/state/config";
import { usePendingTransactions } from "@/state/pending-txs";
import { useSettingsState } from "@/state/settings";
import { Theme } from "@/types/theme";
import { buildPendingTx } from "@/utils/build-pending-tx";
import { isEth, isNativeToken } from "@/utils/is-eth";
import { isNativeUsdc } from "@/utils/is-usdc";

import { FromTo } from "./FromTo";
import { AddressModal } from "./address-modal";
import { DepositFees } from "./fees/deposit-fees";
import { WithdrawFees } from "./fees/withdraw-fees";
import { NftImage } from "./nft";
import { TokenModal } from "./tokens/Modal";
import { Button } from "./ui/button";
import { WithdrawSettingsModal } from "./withdraw-settings/modal";
import { ConfirmationModal } from "./confirmation-modal";

const RecipientAddress = ({
  openAddressDialog,
  theme,
}: {
  openAddressDialog: () => void;
  theme: Theme;
}) => {
  const recipientName = useConfigState.useRecipientName();
  const recipientAddress = useConfigState.useRecipientAddress();
  const account = useAccount();
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      onClick={!account.address ? () => {} : openAddressDialog}
    >
      <div className="flex justify-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 14 14"
          className="fill-zinc-900 dark:fill-zinc-50 w-4 h-4"
        >
          <path d="M7 2.866c.193 0 .382.06.531.202l3.7 3.268c.179.16.341.372.341.664 0 .292-.159.501-.341.664l-3.7 3.268a.773.773 0 01-.531.202.806.806 0 01-.531-1.408l2.171-1.92H3.231a.806.806 0 01-.804-.803c0-.441.362-.803.804-.803h5.41L6.468 4.28A.806.806 0 017 2.872v-.006z"></path>
        </svg>
        <span className={`text-xs font-medium`}>{t("toAddress")}</span>
      </div>

      {!account.address ? (
        <span
          className={clsx(
            "text-xs font-medium text-white",
            theme.textColorMuted
          )}
        >
          …
        </span>
      ) : !recipientAddress ? (
        <div className="flex justify-center gap-1 pl-2 pr-1 py-1 rounded-full cursor-pointer hover:scale-105 transition-all bg-zinc-950">
          <span className="text-xs font-medium text-white">Add address</span>
          <Image
            alt="Address icon"
            src={"/img/address-add.svg"}
            height={14}
            width={14}
          />
        </div>
      ) : (
        <div
          className={clsx(
            `flex justify-center gap-1 pl-2 pr-1 py-1 rounded-full cursor-pointer hover:scale-105 transition-all`,
            "bg-green-100 dark:bg-green-950"
          )}
        >
          <span className={clsx(`text-xs font-medium `, "text-green-500")}>
            {recipientName
              ? recipientName
              : `${recipientAddress.slice(0, 4)}...${recipientAddress.slice(
                  recipientAddress.length - 4
                )}`}
          </span>
          <Image
            alt="Address icon"
            src={"/img/address-ok.svg"}
            height={14}
            width={14}
          />
        </div>
      )}
    </div>
  );
};

export const BridgeBody = () => {
  const { openConnectModal } = useConnectModal();
  const wallet = useWalletClient();
  const account = useAccount();
  const from = useFromChain();
  const to = useToChain();
  const bridgeFee = useBridgeFee();
  const bridge = useBridge();
  const switchChain = useSwitchChain();
  const tokens = useActiveTokens();
  const weiAmount = useWeiAmount();
  const token = useSelectedToken();
  const transferTime = useTransferTime();
  const { t } = useTranslation();

  const [tokensDialog, setTokensDialog] = useState(false);
  const [withdrawSettingsDialog, setWithdrawSettingsDialog] = useState(false);
  const [addressDialog, setAddressDialog] = useState(false);

  const deployment = useConfigState.useDeployment();
  const setConfirmationModal = useConfigState.useSetDisplayConfirmationModal();
  const withdrawing = useConfigState.useWithdrawing();
  const rawAmount = useConfigState.useRawAmount();
  const stateToken = useConfigState.useToken();
  const forceViaL1 = useConfigState.useForceViaL1();
  const setRawAmount = useConfigState.useSetRawAmount();
  const nft = useConfigState.useNft();
  const recipient = useConfigState.useRecipientAddress();
  const setToken = useConfigState.useSetToken();
  const currency = useSettingsState.useCurrency();
  const addPendingTransaction = usePendingTransactions.useAddTransaction();
  const updatePendingTransactionHash =
    usePendingTransactions.useUpdateTransactionByHash();
  const nativeToken = useNativeToken();

  const track = useBridgeControllerTrack();

  const ethBalance = useBalance({ address: wallet.data?.account.address });
  const tokenBalance = useTokenBalance(token);
  const feeData = useFeeData({
    chainId: forceViaL1 && withdrawing ? deployment?.l1.id : from?.id,
  });
  const allowance = useAllowance(token, bridge.address);
  const nftAllowance = useAllowanceNft();

  let networkFee: number | undefined;
  if (feeData.data) {
    const gwei =
      (feeData.data.gasPrice ?? feeData.data.maxFeePerGas)! *
      BigInt(withdrawing ? 200_000 : 150_000);
    networkFee = parseFloat(formatUnits(gwei, 18));
  }

  const approve = useApprove(
    token,
    bridge.address,
    allowance.refetch,
    bridge.refetch,
    weiAmount
  );
  const approveNft = useApproveNft(nftAllowance.refetch, bridge.refetch);
  const usdPrice = useTokenPrice(stateToken);

  const fee = parseInt(((bridgeFee.data as bigint) ?? BigInt(0)).toString());

  const parsedRawAmount = parseFloat(rawAmount) || 0;
  const appliedFee = (fee / 10_000) * parsedRawAmount;
  const receive = parsedRawAmount - appliedFee;

  const hasInsufficientBalance = weiAmount > tokenBalance;
  const hasInsufficientGas =
    networkFee &&
    BigInt(parseUnits(networkFee.toFixed(18), 18)) >
      (ethBalance.data?.value ?? BigInt(0));

  const onWrite = async () => {
    if (!account.address || !wallet.data || !bridge.valid || !recipient) {
      console.warn("Missing connected account");
      return;
    }

    if (!withdrawing && wallet.data.chain.id !== deployment!.l1.id) {
      await switchChain(deployment!.l1);
    }

    if (
      withdrawing &&
      forceViaL1 &&
      wallet.data.chain.id !== deployment!.l1.id
    ) {
      await switchChain(deployment!.l1);
    }

    if (withdrawing && wallet.data.chain.id !== deployment!.l2.id) {
      await switchChain(deployment!.l2);
    }

    try {
      const { hash } = await bridge.write.sendTransactionAsync!();
      waitForTransaction({
        hash,
        chainId: withdrawing
          ? forceViaL1
            ? deployment!.l1.id
            : deployment?.l2.id
          : deployment?.l1.id,
        onReplaced: ({ replacedTransaction, transaction }) => {
          updatePendingTransactionHash(
            replacedTransaction.hash,
            transaction.hash
          );
        },
      });
      track.mutate({
        data: {
          amount: weiAmount.toString(),
          deploymentId: deployment!.id,
          transactionHash: hash,
          action: withdrawing
            ? forceViaL1
              ? "force-withdraw"
              : "withdraw"
            : "deposit",
        },
      });

      const pending = buildPendingTx(
        deployment!,
        account.address,
        recipient,
        weiAmount,
        stateToken,
        nft,
        withdrawing,
        hash,
        forceViaL1
      );
      if (pending) addPendingTransaction(pending);

      if (nft) {
        setToken(tokens.find((x) => isNativeToken(x))!);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const lineItems = [
    stateToken
      ? {
          icon: "/img/receive.svg",
          left: t("receiveOnChain", { chain: to?.name }),
          middle: usdPrice
            ? `${currencySymbolMap[currency]}${(
                receive * usdPrice
              ).toLocaleString("en")}`
            : undefined,
          right: `${receive.toLocaleString("en", {
            maximumFractionDigits: 4,
          })} ${stateToken?.[to?.id ?? 0]?.symbol}`,
        }
      : nft
      ? {
          icon: "/img/receive.svg",
          left: t("receiveOnChain", { chain: to?.name }),
          component: (
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium">#{nft.tokenId}</div>
              <NftImage
                nft={{
                  address: nft.localConfig.address,
                  chainId: nft.localConfig.chainId,
                  tokenId: nft.tokenId,
                  image: nft.image,
                  tokenUri: nft.tokenUri,
                }}
                className="h-6 w-6 rounded-sm"
              />
            </div>
          ),
        }
      : null,
    {
      icon: "/img/transfer-time.svg",
      left: t("transferTime"),
      right: transferTime,
    },
  ].filter(isPresent);

  const onSubmit = async () => {
    await onWrite();
    allowance.refetch();
  };

  const handleSubmitClick = () => {
    if (!nft && weiAmount === BigInt(0)) {
      return;
    }

    setConfirmationModal(true);
  };

  const submitButton = match({
    disabled: deployment?.name === "orb3-mainnet" && !withdrawing,
    withdrawing,
    isSubmitting: bridge.write.isLoading,
    account: account.address,
    wallet: wallet.data,
    hasInsufficientBalance,
    hasInsufficientGas,
    forceViaL1,
    allowance: allowance.data,
    nftAllowance: nftAllowance.data,
    approve,
    approveNft,
    token,
    nft,
    isEth: isEth(token),
    recipient,
  })
    .with({ disabled: true }, () => ({
      onSubmit: () => {},
      buttonText: t("depositDisabled"),
      disabled: true,
    }))
    .with({ account: undefined }, () => ({
      onSubmit: () => openConnectModal?.(),
      buttonText: t("connectWallet"),
      disabled: false,
    }))
    .with({ recipient: "" }, ({ withdrawing }) => ({
      onSubmit: () => {},
      buttonText: withdrawing ? t("withdraw") : t("deposit"),
      disabled: true,
    }))
    .with(
      {
        wallet: { chain: { id: P.not(from?.id) } },
        forceViaL1: false,
        withdrawing: P.select(),
      },
      (w) => ({
        onSubmit: () => {
          if (!from) return;
          switchChain(from);
        },
        buttonText: t("switchTo", {
          chain: w ? deployment?.l2.name : deployment?.l1.name,
        }),
        disabled: false,
      })
    )
    .with(
      {
        withdrawing: true,
        forceViaL1: true,
        wallet: { chain: { id: P.not(to?.id) } },
      },
      () => ({
        onSubmit: () => {
          if (!to) return;
          switchChain(to);
        },
        buttonText: t("switchTo", {
          chain: deployment?.l1.name,
        }),
        disabled: false,
      })
    )
    .with({ hasInsufficientBalance: true }, () => ({
      onSubmit: () => {},
      buttonText: t("insufficientFunds"),
      disabled: true,
    }))
    .with({ hasInsufficientGas: true }, (d) => ({
      onSubmit: handleSubmitClick,
      buttonText: t("insufficientGas", {
        symbol: nativeToken?.[from?.id ?? 0]?.symbol ?? "ETH",
      }),
      // Let's not disable here because people could actually submit with
      // a lower gas price via their wallet. A little power-usery but important imo
      disabled: false,
    }))
    .otherwise((d) => ({
      onSubmit: handleSubmitClick,
      buttonText: d.nft
        ? d.withdrawing
          ? t("withdrawNft", { tokenId: `#${d.nft.tokenId}` })
          : t("depositNft", { tokenId: `#${d.nft.tokenId}` })
        : d.withdrawing
        ? t("withdraw")
        : t("deposit"),
      disabled: false,
    }));

  const theme = deploymentTheme(deployment);
  return (
    <div className="flex flex-col gap-3 md:gap-4 px-4 pb-4">
      <TokenModal open={tokensDialog} setOpen={setTokensDialog} />
      <WithdrawSettingsModal
        open={withdrawSettingsDialog}
        setOpen={setWithdrawSettingsDialog}
        from={from}
        // @ts-expect-error
        bridgeFee={bridgeFee}
        gasEstimate={200_000}
      />
      <AddressModal open={addressDialog} setOpen={setAddressDialog} />
      <ConfirmationModal
        onConfirm={onSubmit}
        approve={approve}
        allowance={allowance}
        bridge={bridge}
      />
      <FromTo />

      {token ? (
        <div
          className={`relative rounded-[16px] px-4 py-3 border-2 border-transparent focus-within:border-zinc-950/[0.01] dark:focus-within:border-zinc-50/[0.02] transition-colors ${theme.bgMuted} `}
        >
          <label
            htmlFor="amount"
            className={`block text-xs font-medium leading-6 ${theme.textColor}`}
          >
            {withdrawing ? t("withdraw") : t("deposit")}
          </label>
          <div className="relative">
            <input
              value={rawAmount}
              onChange={(e) => {
                const parsed = e.target.value.replaceAll(",", ".");
                setRawAmount(parsed);
              }}
              type="text"
              inputMode="decimal"
              minLength={1}
              maxLength={79}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              pattern="^[0-9]*[.,]?[0-9]*$"
              name="amount"
              id="amount"
              className={`block w-full shadow-none bg-transparent focus:outline-none font-medium text-2xl md:text-3xl sm:leading-6 placeholder:text-zinc-400 ${theme.textColor}`}
              placeholder="0"
            />

            <button
              onClick={() => setTokensDialog(true)}
              className={`absolute inset-y-0 right-0 flex gap-x-2 rounded-full pl-3 pr-3 items-center font-medium transition-all hover:scale-105 ${theme.textColor} ${theme.bg}`}
            >
              <img
                src={token?.logoURI}
                width={20}
                height={20}
                alt="Token Icon"
                className="pointer-events-none rounded-full"
              />
              {token?.symbol}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={14}
                height={14}
                className={`w-3.5 h-3.5 fill-zinc-900 dark:fill-zinc-50 `}
                viewBox="0 0 16 16"
              >
                <path d="M13.53 6.031l-5 5a.75.75 0 01-1.062 0l-5-5A.751.751 0 113.531 4.97L8 9.439l4.47-4.47a.751.751 0 011.062 1.062h-.001z"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              {usdPrice && (
                <span className={`${theme.textColorMuted} text-xs font-medium`}>
                  ${(parsedRawAmount * usdPrice).toLocaleString("en")}
                </span>
              )}
            </div>
            <div>
              <span className={`${theme.textColorMuted} text-xs font-medium`}>
                {t("availableBalance", {
                  amount: parseFloat(
                    formatUnits(tokenBalance, token?.decimals ?? 18)
                  ).toLocaleString("en", {
                    maximumFractionDigits: 4,
                  }),
                  symbol: token?.symbol,
                })}
              </span>
            </div>
          </div>
        </div>
      ) : nft ? (
        <>
          <div
            className={`relative rounded-[16px] px-4 py-3 border-2 border-transparent focus-within:border-zinc-950/[0.01] dark:focus-within:border-zinc-50/[0.02] transition-colors ${theme.bgMuted} `}
          >
            <label
              htmlFor="amount"
              className={`block text-xs font-medium leading-6 ${theme.textColor}`}
            >
              {withdrawing ? t("withdraw") : t("deposit")}
            </label>
            <div className="relative">
              <div
                className="flex justify-between items-center gap-2 cursor-pointer group"
                onClick={() => setTokensDialog(true)}
                role="button"
              >
                <div className="flex gap-2  items-center ">
                  <NftImage nft={nft} className="h-12 w-12 rounded-lg" />
                  <div className="flex flex-col gap-0">
                    <div>#{nft.tokenId}</div>
                    <div className="text-xs">{nft.name}</div>
                  </div>
                </div>
                <div
                  className={`flex h-8 w-8 justify-center rounded-full p-2 items-center font-medium transition-all group-hover:scale-105 ${theme.textColor} ${theme.bg}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={14}
                    height={14}
                    className={`w-3.5 h-3.5 fill-zinc-900 dark:fill-zinc-50 `}
                    viewBox="0 0 16 16"
                  >
                    <path d="M13.53 6.031l-5 5a.75.75 0 01-1.062 0l-5-5A.751.751 0 113.531 4.97L8 9.439l4.47-4.47a.751.751 0 011.062 1.062h-.001z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div
        className={`border ${theme.border} rounded-2xl divide-y divide-zinc-100 dark:divide-white/10`}
      >
        <RecipientAddress
          theme={theme}
          openAddressDialog={() => setAddressDialog(true)}
        />
        {lineItems.map(({ left, middle, right, icon, component }) => (
          <div
            key={left}
            className="flex items-center justify-between px-3 py-2 md:py-3"
          >
            <div className="flex justify-center gap-2">
              <Image
                alt={icon}
                src={icon}
                height={16}
                width={16}
                className="w-4 h-4"
              />
              <span className={`${theme.textColor} text-xs font-medium`}>
                {left}
              </span>
            </div>

            {component ? (
              component
            ) : (
              <div className="flex items-center">
                {middle && (
                  <span
                    className={`${theme.textColorMuted} ml-auto text-xs font-medium mr-2`}
                  >
                    {middle}
                  </span>
                )}
                <span
                  className={`text-xs font-medium ${theme.textColor} text-right`}
                >
                  {right}
                </span>
              </div>
            )}
          </div>
        ))}

        {withdrawing ? (
          <WithdrawFees
            gasEstimate={200_000}
            openSettings={() => setWithdrawSettingsDialog(true)}
          />
        ) : (
          <DepositFees gasEstimate={200_000} />
        )}
      </div>

      <Button
        disabled={bridge.write.isLoading || submitButton.disabled}
        onClick={submitButton.onSubmit}
        className={`flex w-full justify-center rounded-full px-3 py-6 text-sm font-bold leading-6 text-white shadow-sm ${theme.accentText} ${theme.accentBg}`}
      >
        {submitButton.buttonText}
      </Button>
    </div>
  );
};
