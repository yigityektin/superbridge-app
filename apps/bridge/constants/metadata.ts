import { dedicatedDeployment } from "@/config/dedicated-deployment";
import { isSuperbridge } from "@/config/superbridge";

export const title =
  dedicatedDeployment?.og.title ?? isSuperbridge ? "Superbridge" : "Rollbridge";

export const description =
  dedicatedDeployment?.og.description ?? isSuperbridge
    ? "Bridge ETH and ERC20 tokens into and out of the Superchain"
    : "Bridge ETH and ERC20 tokens into and out of Optimism OP Stack rollups and Arbitrum Nitro rollups";
