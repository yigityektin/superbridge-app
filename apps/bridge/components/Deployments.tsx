import clsx from "clsx";
import { motion } from "framer-motion";

import { DeploymentDto } from "@/codegen/model";
import { BridgePlaceholder } from "@/components/bridge-placeholder";
import { HIDDEN_DEPLOYMENTS, useDeployments } from "@/hooks/use-deployments";
import { useNavigate } from "@/hooks/use-navigate";
import { PageTransition } from "./PageTransition";

const spring = {
  type: "spring",
  damping: 25,
  stiffness: 1000,
};

const COMING_SOON_DEPLOYMENTS = [
  {
    name: "frame",
    conduitId: null,
    displayName: "Frame",
  },
  {
    name: "aevo",
    conduitId: "aevo",
    displayName: "Aevo",
  },
  {
    name: "ancient8",
    conduitId: "ancient8",
    displayName: "Ancient8",
  },
];

const NEW_DEPLOYMENTS = ["mode", "lyra", "orderly"];

export const DeploymentsGrid = ({}) => {
  const { deployments } = useDeployments();
  const navigate = useNavigate();

  const onDeploymentClick = (n: DeploymentDto) => {
    navigate(n);
  };

  return (
    <PageTransition>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-3 md:px-16 py-40 pt-[96px] md:pt-40 w-full h-auto w-screen max-w-[1334px]">
        {deployments
          .filter((d) => !HIDDEN_DEPLOYMENTS.includes(d.name))
          .map((n) => (
            <motion.div
              key={"grid" + n.displayName}
              transition={spring}
              whileHover={{
                scale: 1.0175,
              }}
              whileTap={{
                scale: 1.01,
                opacity: 1,
              }}
              onTap={() => onDeploymentClick(n)}
            >
              <div className="w-full aspect-[3/4] relative ">
                <BridgePlaceholder
                  deployment={n}
                  newDeployment={NEW_DEPLOYMENTS.includes(n.name)}
                />
              </div>
            </motion.div>
          ))}

        {typeof window !== "undefined" &&
          window.location.host === "app.rollbridge.app" && (
            <>
              {COMING_SOON_DEPLOYMENTS.map((n, index) => (
                <motion.div
                  key={"grid" + n.displayName}
                  transition={spring}
                  whileHover={{
                    scale: 1,
                  }}
                  whileTap={{
                    scale: 1,
                    opacity: 0.8,
                  }}
                >
                  <div
                    className={clsx(
                      "w-full aspect-[3/4] relative",
                      index === COMING_SOON_DEPLOYMENTS.length - 1 && "mb-40"
                    )}
                  >
                    <BridgePlaceholder deployment={n} comingSoon />
                  </div>
                </motion.div>
              ))}
            </>
          )}
      </div>
    </PageTransition>
  );
};
