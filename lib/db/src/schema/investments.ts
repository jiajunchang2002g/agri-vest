import { pgTable, text, serial, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const investmentStatusEnum = pgEnum("investment_status", ["pending", "escrowed", "released", "returned"]);

export const investmentsTable = pgTable("investments", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  investorWallet: text("investor_wallet").notNull(),
  investorName: text("investor_name"),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  txHash: text("tx_hash"),
  escrowSequence: integer("escrow_sequence"),
  status: investmentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvestmentSchema = createInsertSchema(investmentsTable).omit({
  id: true,
  status: true,
  txHash: true,
  escrowSequence: true,
  createdAt: true,
});

export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investmentsTable.$inferSelect;
