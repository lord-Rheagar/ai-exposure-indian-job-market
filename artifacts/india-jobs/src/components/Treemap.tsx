import { useMemo, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { motion } from "framer-motion";
import { type Occupation } from "@workspace/api-client-react";
import { getExposureColor } from "@/lib/utils";

interface TreemapProps {
  data: Occupation[];
  onHover: (data: Occupation | null, event: React.MouseEvent | null) => void;
}

export function Treemap({ data, onHover }: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const rootNodes = useMemo(() => {
    if (!dimensions.width || !dimensions.height || data.length === 0) return [];

    const grouped = d3.group(data, (d) => d.category);
    const hierarchyData = {
      name: "root",
      children: Array.from(grouped, ([key, values]) => ({
        name: key,
        children: values,
      })),
    };

    const root = d3
      .hierarchy(hierarchyData)
      .sum((d: any) => d.jobs || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap()
      .size([dimensions.width, dimensions.height])
      .paddingTop(28)
      .paddingRight(2)
      .paddingBottom(2)
      .paddingLeft(2)
      .paddingInner(2)
      .round(true)(root);

    return root.children || [];
  }, [data, dimensions]);

  return (
    <div className="relative w-full h-full p-4 overflow-hidden" ref={containerRef}>
      {rootNodes.map((categoryNode: any) => {
        const { x0, y0, x1, y1, data: catData, children } = categoryNode;
        const width = x1 - x0;
        const height = y1 - y0;

        if (width < 20 || height < 30) return null;

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            key={catData.name}
            className="absolute rounded-xl border border-white/5 bg-white/[0.02]"
            style={{
              left: x0,
              top: y0,
              width,
              height,
            }}
          >
            <div className="h-7 px-3 flex items-center">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground truncate uppercase">
                {catData.name}
              </span>
            </div>
            
            {children?.map((jobNode: any) => {
              const jX0 = jobNode.x0 - x0;
              const jY0 = jobNode.y0 - y0;
              const jW = jobNode.x1 - jobNode.x0;
              const jH = jobNode.y1 - jobNode.y0;
              const job: Occupation = jobNode.data;

              if (jW < 2 || jH < 2) return null;

              return (
                <div
                  key={job.slug}
                  className="absolute cursor-crosshair rounded-md transition-all duration-200 hover:brightness-125 hover:z-10 hover:shadow-xl hover:shadow-black/50"
                  style={{
                    left: jX0,
                    top: jY0,
                    width: jW,
                    height: jH,
                    backgroundColor: getExposureColor(job.exposure),
                  }}
                  onMouseMove={(e) => onHover(job, e)}
                  onMouseLeave={() => onHover(null, null)}
                >
                  {jW > 50 && jH > 20 && (
                    <div className="w-full h-full p-1.5 overflow-hidden">
                      <span className="text-[10px] font-medium leading-none text-black/80 mix-blend-color-burn break-words block">
                        {job.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        );
      })}
    </div>
  );
}
