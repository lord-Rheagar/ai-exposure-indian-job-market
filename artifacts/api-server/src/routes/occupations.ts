import { Router, type IRouter } from "express";
import { GetOccupationsResponse } from "@workspace/api-zod";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

let cachedData: unknown[] | null = null;

function loadOccupations(): unknown[] {
  if (cachedData) return cachedData;

  const dataPath = path.resolve(
    import.meta.dirname,
    "../data/occupations.json"
  );

  if (!fs.existsSync(dataPath)) {
    console.warn("occupations.json not found, returning empty array");
    return [];
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  cachedData = JSON.parse(raw);
  return cachedData!;
}

router.get("/occupations", (_req, res) => {
  const data = loadOccupations();
  const validated = GetOccupationsResponse.parse(data);
  res.json(validated);
});

export default router;
