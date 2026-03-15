import { useState } from "react";
import { useOccupations } from "@/hooks/use-occupations";
import { Sidebar } from "@/components/Sidebar";
import { Treemap } from "@/components/Treemap";
import { Columns } from "@/components/Columns";
import { Tooltip } from "@/components/Tooltip";
import { type Occupation } from "@workspace/api-client-react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: occupations, isLoading, isError } = useOccupations();
  const [view, setView] = useState<"treemap" | "columns">("treemap");
  const [hoverData, setHoverData] = useState<{ node: Occupation | null, pos: { x: number, y: number } }>({
    node: null, pos: { x: 0, y: 0 }
  });

  const handleHover = (node: Occupation | null, e: React.MouseEvent | null) => {
    if (node && e) {
      setHoverData({ node, pos: { x: e.clientX, y: e.clientY } });
    } else {
      setHoverData({ node: null, pos: { x: 0, y: 0 } });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-6" />
        <h2 className="text-2xl font-display font-bold animate-pulse">Analyzing Indian Economy...</h2>
        <p className="text-muted-foreground mt-2">Loading PLFS and NCO classification data</p>
      </div>
    );
  }

  if (isError || !occupations) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-display font-bold">Failed to load data</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-center">
          The occupation data could not be fetched. Make sure the backend endpoint /api/occupations is running.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background overflow-hidden selection:bg-emerald-500/30">
      <Sidebar data={occupations} />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header / Tabs */}
        <header className="flex-none p-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              AI Exposure of the Indian Job Market
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {occupations.length} occupations &middot; color = AI exposure &middot; Scored by AI
            </p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setView("treemap")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                view === "treemap" 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              Treemap
            </button>
            <button
              onClick={() => setView("columns")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                view === "columns" 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              Exposure vs Outlook
            </button>
          </div>
        </header>

        {/* View Area */}
        <div className="flex-1 relative w-full h-full overflow-hidden">
          {view === "treemap" ? (
            <Treemap data={occupations} onHover={handleHover} />
          ) : (
            <Columns data={occupations} onHover={handleHover} />
          )}
        </div>
      </main>

      <Tooltip data={hoverData.node} position={hoverData.pos} />
    </div>
  );
}
