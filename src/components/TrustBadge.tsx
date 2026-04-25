import { cn } from "@/lib/utils";
import { trustColorClass, trustTier } from "@/data/facilities";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

const sizeMap = {
  sm: "w-10 h-10 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-24 h-24 text-3xl border-4",
};

export const TrustBadge = ({ score, size = "md", glow = true }: Props) => {
  const tier = trustTier(score);
  return (
    <div
      className={cn(
        "rounded-full grid place-items-center font-bold text-white shrink-0",
        trustColorClass(score),
        sizeMap[size],
        glow && tier === "high" && size !== "sm" && "trust-glow-high"
      )}
    >
      {score}
    </div>
  );
};
