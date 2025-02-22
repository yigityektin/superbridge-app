import { Address, encodeFunctionData } from "viem";

import { OptimismToken } from "@/types/token";
import { GRAFFITI } from "@/constants/extra-data";
import { L2BridgeAbi } from "@/abis/L2Bridge";
import { L2StandardBridgeAbi } from "@/abis/L2StandardBridge";
import { OptimismPortalAbi } from "@/abis/OptimismPortal";

import { isOptimismToken } from "../../guards";
import { isEth } from "../../is-eth";
import { OptimismDeploymentDto, isOptimism } from "../../is-mainnet";
import { withdrawValue } from "../../withdraw-value";
import { TransactionArgs, WithdrawTxResolver } from "./types";

const impl = (
  deployment: OptimismDeploymentDto,
  l1Token: OptimismToken,
  l2Token: OptimismToken,
  proxyBridge: Address | undefined,
  l2TokenIsLegacy: boolean,
  recipient: Address,
  weiAmount: bigint,
  easyMode: boolean
): TransactionArgs | undefined => {
  // proxy
  if (proxyBridge && easyMode) {
    const value = withdrawValue(weiAmount, deployment, l2Token, easyMode);
    if (isEth(l2Token)) {
      return {
        approvalAddress: undefined,
        tx: {
          to: proxyBridge,
          data: encodeFunctionData({
            abi: L2BridgeAbi,
            functionName: "initiateEtherWithdrawal",
            args: [
              deployment.contractAddresses.l2.L2StandardBridge as Address, // _l2StandardBridge
              recipient, // _to
              weiAmount, // _amount
            ],
          }),
          value,
          chainId: deployment.l2.id,
        },
      };
    }

    if (l2TokenIsLegacy) {
      return {
        approvalAddress: proxyBridge,
        tx: {
          to: proxyBridge,
          data: encodeFunctionData({
            abi: L2BridgeAbi,
            functionName: "legacy_initiateERC20Withdrawal",
            args: [
              l2Token.standardBridgeAddresses![deployment.l1.id]!,
              l2Token.address, // _localToken
              l1Token.address, // _remoteToken
              recipient, // _to
              weiAmount, // _amount
            ],
          }),
          value,
          chainId: deployment.l2.id,
        },
      };
    }

    return {
      approvalAddress: proxyBridge,
      tx: {
        to: proxyBridge,
        data: encodeFunctionData({
          abi: L2BridgeAbi,
          functionName: "initiateERC20Withdrawal",
          args: [
            l2Token.standardBridgeAddresses![deployment.l1.id]!,
            l2Token.address, // _localToken
            l1Token.address, // _remoteToken
            recipient, // _to
            weiAmount, // _amount
          ],
        }),
        value,
        chainId: deployment.l2.id,
      },
    };
  }

  // standard bridge
  if (isEth(l2Token)) {
    return {
      approvalAddress: undefined,
      tx: {
        to: deployment.contractAddresses.l2.L2StandardBridge as Address,
        data: encodeFunctionData({
          abi: L2StandardBridgeAbi,
          functionName: "bridgeETHTo",
          args: [
            recipient, // _to
            200_000, // _gas
            GRAFFITI, // _extraData
          ],
        }),
        value: weiAmount,
        chainId: deployment.l2.id,
      },
    };
  }

  if (l2TokenIsLegacy) {
    return {
      approvalAddress: l2Token.standardBridgeAddresses[deployment.l1.id]!,
      tx: {
        to: l2Token.standardBridgeAddresses[deployment.l1.id]!,
        data: encodeFunctionData({
          abi: L2StandardBridgeAbi,
          functionName: "withdrawTo",
          args: [
            l2Token.address, // _localToken
            recipient, // _to
            weiAmount, // _amount
            200_000, // _minGasLimit
            GRAFFITI, // _extraData
          ],
        }),
        value: BigInt(0),
        chainId: deployment.l2.id,
      },
    };
  }

  return {
    approvalAddress: l2Token.standardBridgeAddresses[deployment.l1.id]!,
    tx: {
      to: l2Token.standardBridgeAddresses[deployment.l1.id]!,
      data: encodeFunctionData({
        abi: L2StandardBridgeAbi,
        functionName: "bridgeERC20To",
        args: [
          l2Token.address, // _localToken
          l1Token.address, // _remoteToken
          recipient, // _to
          weiAmount, // _amount
          200_000, // _minGasLimit
          GRAFFITI, // _extraData
        ],
      }),
      value: BigInt(0),
      chainId: deployment.l2.id,
    },
  };
};

export const optimismWithdrawArgs: WithdrawTxResolver = ({
  deployment,
  stateToken,
  proxyBridge,
  recipient,
  l2TokenIsLegacy,
  weiAmount,
  options,
}) => {
  const l1Token = stateToken[deployment.l1.id];
  const l2Token = stateToken[deployment.l2.id];

  if (
    !l1Token ||
    !l2Token ||
    !isOptimismToken(l1Token) ||
    !isOptimismToken(l2Token) ||
    !isOptimism(deployment) ||
    typeof l2TokenIsLegacy === "undefined"
  ) {
    return;
  }

  const result = impl(
    deployment,
    l1Token,
    l2Token,
    proxyBridge,
    l2TokenIsLegacy,
    recipient,
    weiAmount,
    options.easyMode
  );

  if (!result) {
    return;
  }

  if (options.forceViaL1) {
    return {
      approvalAddress: result.approvalAddress,
      tx: {
        to: deployment.contractAddresses.optimismPortal as Address,
        data: encodeFunctionData({
          abi: OptimismPortalAbi,
          functionName: "depositTransaction",
          args: [
            result.tx.to,
            result.tx.value,
            BigInt(200_000),
            false,
            result.tx.data,
          ],
        }),
        chainId: deployment.l1.id,
        value: BigInt(0),
        gas: BigInt("300000"),
      },
    };
  }

  return result;
};
