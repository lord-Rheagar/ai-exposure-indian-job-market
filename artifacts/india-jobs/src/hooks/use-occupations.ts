import { useQuery } from "@tanstack/react-query";
import { type Occupation } from "@workspace/api-client-react";

// In case the workspace api-client-react doesn't have the hook ready
// we fallback to manual fetch but strongly type it.
export function useOccupations() {
  return useQuery<Occupation[]>({
    queryKey: ["/api/occupations"],
    queryFn: async () => {
      const res = await fetch("/api/occupations");
      if (!res.ok) {
        throw new Error("Failed to fetch occupations");
      }
      return res.json();
    },
  });
}
