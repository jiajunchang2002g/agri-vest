import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, campaignsTable, investmentsTable } from "@workspace/db";
import {
  ListCampaignsQueryParams,
  CreateCampaignBody,
  GetCampaignParams,
  UpdateCampaignParams,
  UpdateCampaignBody,
  GetWalletCampaignsParams,
} from "@workspace/api-zod";
import { generateMockEscrowData } from "../lib/xrpl";

const router: IRouter = Router();

function formatCampaign(c: any) {
  return {
    ...c,
    goalAmount: parseFloat(c.goalAmount),
    currentAmount: parseFloat(c.currentAmount),
    updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
    createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
  };
}

router.get("/campaigns", async (req, res): Promise<void> => {
  const params = ListCampaignsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(campaignsTable).$dynamic();

  if (params.data.status) {
    query = query.where(eq(campaignsTable.status, params.data.status as any));
  } else if (params.data.category) {
    query = query.where(eq(campaignsTable.category, params.data.category));
  }

  const campaigns = await query.orderBy(desc(campaignsTable.createdAt));
  res.json(campaigns.map(formatCampaign));
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, farmerWallet, farmerName, goalAmount, deadline, category, imageUrl, location } = parsed.data;

  const [campaign] = await db
    .insert(campaignsTable)
    .values({
      title,
      description,
      farmerWallet,
      farmerName,
      goalAmount: String(goalAmount),
      deadline,
      category,
      imageUrl: imageUrl ?? null,
      location: location ?? null,
    })
    .returning();

  res.status(201).json(formatCampaign(campaign));
});

router.get("/campaigns/stats", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalCampaigns: sql<number>`count(*)::int`,
      activeCampaigns: sql<number>`count(*) filter (where status = 'active')::int`,
      totalFunded: sql<number>`count(*) filter (where status = 'funded')::int`,
      totalXrpRaised: sql<number>`coalesce(sum(current_amount::numeric), 0)::float`,
    })
    .from(campaignsTable);

  const [investorResult] = await db
    .select({ totalInvestors: sql<number>`count(distinct investor_wallet)::int` })
    .from(investmentsTable);

  const categoryRows = await db
    .select({
      category: campaignsTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(campaignsTable)
    .groupBy(campaignsTable.category);

  res.json({
    totalCampaigns: totals.totalCampaigns,
    activeCampaigns: totals.activeCampaigns,
    totalFunded: totals.totalFunded,
    totalInvestors: investorResult.totalInvestors,
    totalXrpRaised: totals.totalXrpRaised,
    categoryCounts: categoryRows,
  });
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCampaignParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid campaign ID" });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, params.data.id));

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.json(formatCampaign(campaign));
});

router.patch("/campaigns/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCampaignParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid campaign ID" });
    return;
  }

  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [campaign] = await db
    .update(campaignsTable)
    .set(parsed.data)
    .where(eq(campaignsTable.id, params.data.id))
    .returning();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  res.json(formatCampaign(campaign));
});

router.get("/wallet/:address/campaigns", async (req, res): Promise<void> => {
  const rawAddr = Array.isArray(req.params.address) ? req.params.address[0] : req.params.address;
  const params = GetWalletCampaignsParams.safeParse({ address: rawAddr });
  if (!params.success) {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  const campaigns = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.farmerWallet, params.data.address))
    .orderBy(desc(campaignsTable.createdAt));

  res.json(campaigns.map(formatCampaign));
});

export default router;
