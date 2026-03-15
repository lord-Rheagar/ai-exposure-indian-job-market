import { useMemo } from "react";
import { motion } from "framer-motion";
import { type Occupation } from "@workspace/api-client-react";
import { getExposureColor, formatJobs } from "@/lib/utils";

interface ColumnsProps {
  data: Occupation[];
  onHover: (data: Occupation | null, event: React.MouseEvent | null) => void;
}

function getOutlookColor(outlook: number): string {
  if (outlook >= 8) return "#10b981";
  if (outlook >= 4) return "#6ee7b7";
  if (outlook >= 0) return "#fef08a";
  if (outlook >= -3) return "#f59e0b";
  return "#ef4444";
}

export function Columns({ data, onHover }: ColumnsProps) {
  const { columns, outlookRange } = useMemo(() => {
    const cols: Occupation[][] = Array.from({ length: 11 }, () => []);

    let minOutlook = Infinity;
    let maxOutlook = -Infinity;

    data.forEach((job) => {
      const score = Math.max(0, Math.min(10, Math.round(job.exposure)));
      cols[score].push(job);
      if (job.outlook < minOutlook) minOutlook = job.outlook;
      if (job.outlook > maxOutlook) maxOutlook = job.outlook;
    });

    cols.forEach((col) => {
      col.sort((a, b) => b.outlook - a.outlook);
    });

    return {
      columns: cols,
      outlookRange: { min: minOutlook, max: maxOutlook },
    };
  }, [data]);

  const outlookToY = (outlook: number, containerHeight: number) => {
    const range = outlookRange.max - outlookRange.min || 1;
    return containerHeight - ((outlook - outlookRange.min) / range) * containerHeight;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">Dot size = workers</span>
          <span className="font-semibold uppercase tracking-wider">Dot color = outlook</span>
          <div className="flex items-center gap-2 ml-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
            <span>Growing</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full ml-2" style={{ backgroundColor: "#fef08a" }} />
            <span>Stable</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full ml-2" style={{ backgroundColor: "#ef4444" }} />
            <span>Declining</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex px-4 pb-2 relative">
        <div className="w-10 flex flex-col justify-between items-end pr-2 py-4 text-[10px] text-muted-foreground">
          <span>{outlookRange.max}%</span>
          <span>{Math.round((outlookRange.max + outlookRange.min) / 2)}%</span>
          <span>{outlookRange.min}%</span>
        </div>
        <div className="text-[10px] text-muted-foreground absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap font-semibold uppercase tracking-wider">
          Job Outlook
        </div>

        <div className="flex-1 flex gap-1">
          {columns.map((col, colIndex) => (
            <div key={colIndex} className="flex-1 flex flex-col h-full">
              <div className="flex-1 relative border-l border-white/5">
                {col.map((job) => (
                  <motion.div
                    key={job.slug}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: Math.random() * 0.3 }}
                    className="absolute cursor-crosshair transition-all duration-200 hover:brightness-150 hover:z-20 hover:ring-2 hover:ring-white/40 rounded-full"
                    style={{
                      top: `calc(${(outlookToY(job.outlook, 100))}% - ${Math.max(4, Math.min(20, Math.sqrt(job.jobs / 100000)))}px)`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: Math.max(6, Math.min(36, Math.sqrt(job.jobs / 50000))),
                      height: Math.max(6, Math.min(36, Math.sqrt(job.jobs / 50000))),
                      backgroundColor: getOutlookColor(job.outlook),
                      border: `1px solid ${getExposureColor(job.exposure)}`,
                      opacity: 0.85,
                    }}
                    onMouseMove={(e) => onHover(job, e)}
                    onMouseLeave={() => onHover(null, null)}
                  />
                ))}
              </div>

              <div className="h-8 flex flex-col items-center justify-center border-t border-white/10">
                <span className="text-sm font-display font-bold text-foreground">
                  {colIndex}
                </span>
                <span className="text-[9px] text-muted-foreground leading-none">
                  {formatJobs(col.reduce((s, j) => s + j.jobs, 0))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Exposure Score
        </span>
      </div>
    </div>
  );
}
