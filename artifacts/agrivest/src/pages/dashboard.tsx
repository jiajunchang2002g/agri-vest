import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Wallet, ArrowRight, Loader2, TrendingUp, Sprout } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CampaignCard } from "@/components/campaign-card";
import {
  useGetWalletCampaigns,
  useGetWalletInvestments,
  getGetWalletCampaignsQueryKey,
  getGetWalletInvestmentsQueryKey,
} from "@workspace/api-client-react";

function InvestmentRow({ inv }: { inv: any }) {
  const statusColors: Record<string, string> = {
    escrowed: "bg-primary/20 text-primary",
    released: "bg-green-500/20 text-green-400",
    returned: "bg-muted text-muted-foreground",
    pending: "bg-accent/20 text-accent",
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <Link href={`/campaigns/${inv.campaignId}`} className="text-sm font-medium hover:text-primary transition-colors">
          Campaign #{inv.campaignId}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
          {inv.txHash ? `TX: ${inv.txHash.slice(0, 20)}...` : "Pending TX"}
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="font-mono font-bold text-sm">{inv.amount} XRP</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? statusColors.pending}`}>
          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
        </span>
      </div>
    </div>
  );
}

function WalletView({ address }: { address: string }) {
  const { data: campaigns, isLoading: loadingC } = useGetWalletCampaigns(address, {
    query: { enabled: !!address, queryKey: getGetWalletCampaignsQueryKey(address) },
  });
  const { data: investments, isLoading: loadingI } = useGetWalletInvestments(address, {
    query: { enabled: !!address, queryKey: getGetWalletInvestmentsQueryKey(address) },
  });

  const totalInvested = (investments ?? []).reduce((acc, i) => acc + (i.amount ?? 0), 0);
  const activeEscrow = (investments ?? []).filter((i) => i.status === "escrowed").reduce((acc, i) => acc + (i.amount ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Campaigns", value: (campaigns ?? []).length, icon: Sprout },
          { label: "Investments", value: (investments ?? []).length, icon: TrendingUp },
          { label: "Total Invested", value: `${totalInvested.toLocaleString()} XRP`, icon: Wallet },
          { label: "In Escrow", value: `${activeEscrow.toLocaleString()} XRP`, icon: Wallet },
        ].map((s) => (
          <Card key={s.label} className="bg-card/50">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold font-mono text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Campaigns */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          My Campaigns
        </h2>
        {loadingC ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />Loading...
          </div>
        ) : (campaigns ?? []).length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-3">No campaigns yet</p>
            <Button asChild size="sm">
              <Link href="/campaigns/new"><Sprout className="mr-2 h-4 w-4" />Create Campaign</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(campaigns ?? []).map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)}
          </div>
        )}
      </div>

      {/* My Investments */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          My Investments
        </h2>
        {loadingI ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />Loading...
          </div>
        ) : (investments ?? []).length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-3">No investments yet</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/campaigns">Explore Campaigns <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              {(investments ?? []).map((inv) => <InvestmentRow key={inv.id} inv={inv} />)}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [inputAddr, setInputAddr] = useState("");
  const [activeAddr, setActiveAddr] = useState("");

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (inputAddr.startsWith("r") && inputAddr.length >= 25) {
      setActiveAddr(inputAddr);
    }
  }

  return (
    <div className="py-12 px-4 flex-1">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">View your campaigns and investments by XRPL wallet address</p>
        </motion.div>

        <form onSubmit={handleLookup} className="flex gap-3 mb-10">
          <div className="relative flex-1">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter your XRPL wallet address (starts with r...)"
              value={inputAddr}
              onChange={(e) => setInputAddr(e.target.value)}
              className="pl-10 font-mono bg-card"
            />
          </div>
          <Button type="submit" disabled={!inputAddr.startsWith("r") || inputAddr.length < 25}>
            <Search className="mr-2 h-4 w-4" />
            Look Up
          </Button>
        </form>

        {activeAddr ? (
          <motion.div key={activeAddr} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 w-fit">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm text-primary">{activeAddr.slice(0, 16)}...{activeAddr.slice(-8)}</span>
            </div>
            <WalletView address={activeAddr} />
          </motion.div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Enter a wallet address above to view your activity</p>
            <p className="text-xs text-muted-foreground/60 mt-2">Try: rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh</p>
          </div>
        )}
      </div>
    </div>
  );
}
