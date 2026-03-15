import { useMemo } from "react";
import { motion } from "framer-motion";
import { type Occupation } from "@workspace/api-client-react";
import { getExposureColor } from "@/lib/utils";

interface ColumnsProps {
  data: Occupation[];
  onHover: (data: Occupation | null, event: React.MouseEvent | null) => void;
}

export function Columns({ data, onHover }: ColumnsProps) {
  const columns = useMemo(() => {
    // Initialize 11 columns (0 to 10)
    const cols: Occupation[][] = Array.from({ length: 11 }, () => []);
    
    data.forEach((job) => {
      const score = Math.max(0, Math.min(10, Math.round(job.exposure)));
      cols[score].push(job);
    });

    // Sort each column by BLS outlook (descending)
    cols.forEach((col) => {
      col.sort((a, b) => b.outlook - a.outlook);
    });

    return cols;
  }, [data]);

  const maxColumnJobs = useMemo(() => {
    return Math.max(...columns.map((col) => col.reduce((sum, job) => sum + job.jobs, 0)));
  }, [columns]);

  return (
    <div className="w-full h-full p-6 pt-10 flex gap-2">
      {columns.map((col, colIndex) => {
        const colJobs = col.reduce((sum, job) => sum + job.jobs, 0);
        const colHeightPercent = maxColumnJobs > 0 ? (colJobs / maxColumnJobs) * 100 : 0;
        
        return (
          <div key={colIndex} className="flex-1 flex flex-col h-full items-center">
            <div className="mb-4 text-center">
              <span className="text-xl font-display font-bold text-foreground block">
                {colIndex}
              </span>
            </div>
            
            <div className="w-full flex-1 relative flex flex-col justify-end">
              <motion.div 
                className="w-full flex flex-col gap-[1px]"
                initial={{ height: 0 }}
                animate={{ height: `${colHeightPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {col.map((job) => {
                  const heightPercent = colJobs > 0 ? (job.jobs / colJobs) * 100 : 0;
                  return (
                    <div
                      key={job.slug}
                      className="w-full rounded-sm cursor-crosshair transition-all duration-200 hover:brightness-125 hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: heightPercent > 0 ? "2px" : "0",
                        backgroundColor: getExposureColor(job.exposure),
                      }}
                      onMouseMove={(e) => onHover(job, e)}
                      onMouseLeave={() => onHover(null, null)}
                    />
                  );
                })}
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
