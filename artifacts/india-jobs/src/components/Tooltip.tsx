import { motion, AnimatePresence } from "framer-motion";
import { type Occupation } from "@workspace/api-client-react";
import { formatINR, formatJobs, getExposureColor } from "@/lib/utils";

interface TooltipProps {
  data: Occupation | null;
  position: { x: number; y: number };
}

export function Tooltip({ data, position }: TooltipProps) {
  if (!data) return null;

  const tooltipW = 320;
  const tooltipH = 280;
  const pad = 12;
  let left = position.x + 20;
  let top = position.y + 20;
  if (left + tooltipW > window.innerWidth - pad) left = position.x - tooltipW - 10;
  if (top + tooltipH > window.innerHeight - pad) top = position.y - tooltipH - 10;
  left = Math.max(pad, Math.min(left, window.innerWidth - tooltipW - pad));
  top = Math.max(pad, Math.min(top, window.innerHeight - tooltipH - pad));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-none fixed z-50 w-[320px] rounded-2xl glass-panel p-5"
        style={{
          left,
          top,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {data.category}
            </p>
            <h3 className="text-lg font-display font-bold leading-tight text-foreground">
              {data.title}
            </h3>
          </div>
          <div 
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold text-black shadow-inner"
            style={{ backgroundColor: getExposureColor(data.exposure) }}
          >
            {data.exposure}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/5 py-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total Workers</p>
            <p className="font-display font-semibold">{formatJobs(data.jobs)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Median Pay</p>
            <p className="font-display font-semibold">{formatINR(data.pay)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Education</p>
            <p className="font-display text-sm font-medium line-clamp-1">{data.education}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Job Outlook</p>
            <p className="font-display text-sm font-medium">
              <span className={data.outlook >= 0 ? "text-emerald-400" : "text-red-400"}>
                {data.outlook > 0 ? "+" : ""}{data.outlook}%
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-1">AI Exposure Rationale</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {data.exposure_rationale}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
