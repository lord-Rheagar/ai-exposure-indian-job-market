import { Router, type IRouter } from "express";
import { GetOccupationsResponse } from "@workspace/api-zod";
import occupationsData from "../data/occupations.json";

const router: IRouter = Router();

let cachedData: unknown[] | null = null;

function loadOccupations(): unknown[] {
  if (cachedData) return cachedData;
  cachedData = occupationsData;
  return cachedData;
}

router.get("/occupations", (_req, res) => {
  const data = loadOccupations();
  const validated = GetOccupationsResponse.parse(data);
  res.json(validated);
});

export default router;
