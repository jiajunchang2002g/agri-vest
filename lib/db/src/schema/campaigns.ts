import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignStatusEnum = pgEnum("campaign_status", ["active", "funded", "expired", "cancelled"]);

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  farmerWallet: text("farmer_wallet").notNull(),
  farmerName: text("farmer_name").notNull(),
  goalAmount: numeric("goal_amount", { precision: 20, scale: 6 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 20, scale: 6 }).notNull().default("0"),
  deadline: text("deadline").notNull(),
  category: text("category").notNull(),
  status: campaignStatusEnum("status").notNull().default("active"),
  imageUrl: text("image_url"),
  location: text("location"),
  escrowSequence: integer("escrow_sequence"),
  escrowTxHash: text("escrow_tx_hash"),
  investorCount: integer("investor_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({
  id: true,
  currentAmount: true,
  status: true,
  escrowSequence: true,
  escrowTxHash: true,
  investorCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
