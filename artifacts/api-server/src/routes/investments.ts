import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, campaignsTable, investmentsTable } from "@workspace/db";
import {
  InvestInCampaignParams,
  InvestInCampaignBody,
  ListCampaignInvestmentsParams,
  ReleaseEscrowParams,
  CancelEscrowParams,
  GetWalletInvestmentsParams,
} from "@workspace/api-zod";
import { generateMockEscrowData } from "../lib/xrpl";

const router: IRouter = Router();

function formatInvestment(inv: any) {
  return {
    ...inv,
    amount: parseFloat(inv.amount),
    createdAt: inv.createdAt?.toISOString?.() ?? inv.createdAt,
  };
}

router.post("/campaigns/:id/invest", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = InvestInCampaignParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid campaign ID" });
    return;
  }

  const parsed = InvestInCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  if (campaign.status !== "active") {
    res.status(400).json({ error: "Campaign is not accepting investments" });
    return;
  }

  const { investorWallet, investorName, amount } = parsed.data;

  const escrow = generateMockEscrowData();

  const [investment] = await db
    .insert(investmentsTable)
    .values({
      campaignId: params.data.id,
      investorWallet,
      investorName: investorName ?? null,
      amount: String(amount),
      txHash: escrow.txHash,
      escrowSequence: escrow.sequence,
      status: "escrowed",
    })
    .returning();

  const newAmount = parseFloat(campaign.currentAmount) + amount;
  const newCount = (campaign.investorCount ?? 0) + 1;
  const goalAmount = parseFloat(campaign.goalAmount);
  const newStatus = newAmount >= goalAmount ? "funded" : "active";

  await db
    .update(campaignsTable)
    .set({
      currentAmount: String(newAmount),
      investorCount: newCount,
      status: newStatus as any,
    })
    .where(eq(campaignsTable.id, params.data.id));

  req.log.info({ campaignId: params.data.id, amount, txHash: escrow.txHash }, "Investment created");
  res.status(201).json(formatInvestment(investment));
});

router.post("/campaigns/:id/release", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReleaseEscrowParams.safeParse({ id: parseInt(rawId, 10) });
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

  if (campaign.status !== "funded") {
    res.status(400).json({ error: "Campaign must be funded to release escrow" });
    return;
  }

  const releaseResult = generateMockEscrowData();

  await db
    .update(investmentsTable)
    .set({ status: "released" })
    .where(eq(investmentsTable.campaignId, params.data.id));

  req.log.info({ campaignId: params.data.id, txHash: releaseResult.txHash }, "Escrow released");
  res.json({ success: true, message: "Escrow funds released to farmer", txHash: releaseResult.txHash });
});

router.post("/campaigns/:id/cancel", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CancelEscrowParams.safeParse({ id: parseInt(rawId, 10) });
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

  if (campaign.status === "funded") {
    res.status(400).json({ error: "Cannot cancel a funded campaign" });
    return;
  }

  const cancelResult = generateMockEscrowData();

  await db
    .update(campaignsTable)
    .set({ status: "cancelled" })
    .where(eq(campaignsTable.id, params.data.id));

  await db
    .update(investmentsTable)
    .set({ status: "returned" })
    .where(eq(investmentsTable.campaignId, params.data.id));

  req.log.info({ campaignId: params.data.id }, "Campaign cancelled, escrow returned");
  res.json({ success: true, message: "Campaign cancelled and investor funds returned", txHash: cancelResult.txHash });
});

router.get("/campaigns/:id/investments", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListCampaignInvestmentsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid campaign ID" });
    return;
  }

  const investments = await db
    .select()
    .from(investmentsTable)
    .where(eq(investmentsTable.campaignId, params.data.id))
    .orderBy(desc(investmentsTable.createdAt));

  res.json(investments.map(formatInvestment));
});

router.get("/wallet/:address/investments", async (req, res): Promise<void> => {
  const rawAddr = Array.isArray(req.params.address) ? req.params.address[0] : req.params.address;
  const params = GetWalletInvestmentsParams.safeParse({ address: rawAddr });
  if (!params.success) {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  const investments = await db
    .select()
    .from(investmentsTable)
    .where(eq(investmentsTable.investorWallet, params.data.address))
    .orderBy(desc(investmentsTable.createdAt));

  res.json(investments.map(formatInvestment));
});

export default router;
