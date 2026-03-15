import { useMemo } from "react";
import { type Occupation } from "@workspace/api-client-react";
import { formatJobs, formatLargeCurrency, EXPOSURE_COLORS } from "@/lib/utils";

interface SidebarProps {
  data: Occupation[];
}

export function Sidebar({ data }: SidebarProps) {
  const stats = useMemo(() => {
    let totalWorkers = 0;
    let exposureSum = 0;
    let highExposureWages = 0;

    const exposureCounts = Array(11).fill(0);
    
    // Breakdowns
    const bands = [0, 0, 0, 0, 0]; // 0-1, 2-3, 4-5, 6-7, 8-10
    
    // Pay brackets: <3L, 3-6L, 6-12L, 12-24L, 24L+
    const payBrackets = [
      { label: "< ₹3L", min: 0, max: 300_000, jobs: 0, expSum: 0 },
      { label: "₹3–6L", min: 300_000, max: 600_000, jobs: 0, expSum: 0 },
      { label: "₹6–12L", min: 600_000, max: 1_200_000, jobs: 0, expSum: 0 },
      { label: "₹12–24L", min: 1_200_000, max: 2_400_000, jobs: 0, expSum: 0 },
      { label: "₹24L+", min: 2_400_000, max: Infinity, jobs: 0, expSum: 0 },
    ];

    // Education
    const educationMap = new Map<string, { jobs: number, expSum: number }>();

    data.forEach((job) => {
      const exp = Math.max(0, Math.min(10, Math.round(job.exposure)));
      
      totalWorkers += job.jobs;
      exposureSum += (exp * job.jobs);
      exposureCounts[exp] += job.jobs;

      if (exp >= 7) {
        highExposureWages += (job.pay * job.jobs);
      }

      if (exp <= 1) bands[0] += job.jobs;
      else if (exp <= 3) bands[1] += job.jobs;
      else if (exp <= 5) bands[2] += job.jobs;
      else if (exp <= 7) bands[3] += job.jobs;
      else bands[4] += job.jobs;

      const pb = payBrackets.find(b => job.pay >= b.min && job.pay < b.max);
      if (pb) {
        pb.jobs += job.jobs;
        pb.expSum += (exp * job.jobs);
      }

      const eduLevel = job.education || "Unknown";
      if (!educationMap.has(eduLevel)) {
        educationMap.set(eduLevel, { jobs: 0, expSum: 0 });
      }
      const e = educationMap.get(eduLevel)!;
      e.jobs += job.jobs;
      e.expSum += (exp * job.jobs);
    });

    const maxExpCount = Math.max(...exposureCounts);
    
    return {
      totalWorkers,
      weightedAvg: totalWorkers > 0 ? (exposureSum / totalWorkers).toFixed(1) : "0",
      exposureCounts,
      maxExpCount,
      bands: [
        { label: "Minimal (0-1)", count: bands[0] },
        { label: "Low (2-3)", count: bands[1] },
        { label: "Moderate (4-5)", count: bands[2] },
        { label: "High (6-7)", count: bands[3] },
        { label: "Very high (8-10)", count: bands[4] },
      ],
      payBrackets: payBrackets.map(b => ({
        label: b.label,
        avg: b.jobs > 0 ? (b.expSum / b.jobs).toFixed(1) : "0.0"
      })),
      education: Array.from(educationMap.entries()).map(([label, v]) => ({
        label,
        avg: v.jobs > 0 ? (v.expSum / v.jobs).toFixed(1) : "0.0"
      })).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg)),
      highExposureWages
    };
  }, [data]);

  return (
    <div className="w-full lg:w-[340px] h-full bg-card/50 border-r border-white/10 flex flex-col overflow-y-auto hide-scrollbar">
      <div className="p-6 pb-4 border-b border-white/10">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-1">
          Total Workers
        </h2>
        <div className="text-4xl font-display font-bold text-foreground">
          {formatJobs(stats.totalWorkers)}
        </div>
      </div>

      <div className="p-6 pb-4 border-b border-white/10">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-1">
          Weighted Avg. Exposure
        </h2>
        <div className="flex items-baseline gap-3">
          <div className="text-4xl font-display font-bold text-foreground">
            {stats.weightedAvg}
          </div>
          <span className="text-xs text-muted-foreground">job-weighted, 0-10</span>
        </div>
      </div>

      <div className="p-6 pb-4 border-b border-white/10">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-4">
          Jobs by Exposure
        </h2>
        <div className="flex items-end h-24 gap-1.5 w-full">
          {stats.exposureCounts.map((count, i) => {
            const height = stats.maxExpCount > 0 ? (count / stats.maxExpCount) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col justify-end group relative">
                <div 
                  className="w-full rounded-t-sm transition-all duration-300 group-hover:brightness-125 group-hover:-translate-y-1"
                  style={{ 
                    height: `${height}%`, 
                    minHeight: height > 0 ? "4px" : "0",
                    backgroundColor: EXPOSURE_COLORS[i] 
                  }}
                />
                <div className="text-[10px] text-center mt-1 text-muted-foreground">{i}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 pb-4 border-b border-white/10">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-4">
          Breakdown
        </h2>
        <div className="space-y-3">
          {stats.bands.map((b, i) => {
            const pct = stats.totalWorkers > 0 ? (b.count / stats.totalWorkers) * 100 : 0;
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: EXPOSURE_COLORS[i * 2 + 1] }} 
                  />
                  <span className="text-foreground/80">{b.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-medium">{formatJobs(b.count)}</span>
                  <span className="text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 pb-4 border-b border-white/10">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-4">
          Exposure by Pay
        </h2>
        <div className="space-y-2.5">
          {stats.payBrackets.map((b, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-foreground/80">{b.label}</span>
              <span className="font-display font-medium text-amber-400">{b.avg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 pb-4 border-b border-white/10">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-4">
          Exposure by Education
        </h2>
        <div className="space-y-2.5">
          {stats.education.map((b, i) => (
            <div key={i} className="flex justify-between items-center text-sm gap-4">
              <span className="text-foreground/80 truncate" title={b.label}>{b.label}</span>
              <span className="font-display font-medium text-amber-400">{b.avg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-1">
          Wages Exposed
        </h2>
        <div className="text-3xl font-display font-bold text-foreground mb-1">
          {formatLargeCurrency(stats.highExposureWages)}
        </div>
        <p className="text-xs text-muted-foreground">annual wages in high-exposure jobs (7+)</p>
      </div>
      
      <div className="mt-auto p-6 pt-0">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-600" />
        <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
