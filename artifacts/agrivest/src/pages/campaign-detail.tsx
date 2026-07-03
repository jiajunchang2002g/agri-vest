import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Clock, Users, ExternalLink,
  Lock, CheckCircle, CornerUpLeft, Loader2, Leaf
} from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useGetCampaign,
  useListCampaignInvestments,
  useInvestInCampaign,
  useReleaseEscrow,
  useCancelEscrow,
  getGetCampaignQueryKey,
  getListCampaignInvestmentsQueryKey,
} from "@workspace/api-client-react";

const XRPL_EXPLORER = "https://testnet.xrpl.org/transactions/";

function EscrowStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    escrowed: { label: "Escrowed", cls: "bg-primary/20 text-primary border-primary/30", Icon: Lock },
    released: { label: "Released", cls: "bg-green-500/20 text-green-400 border-green-500/30", Icon: CheckCircle },
    returned: { label: "Returned", cls: "bg-muted text-muted-foreground border-border", Icon: CornerUpLeft },
    pending:  { label: "Pending",  cls: "bg-accent/20 text-accent border-accent/30", Icon: Loader2 },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.cls}`}>
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id, 10);
  const qc = useQueryClient();
  const { toast } = useToast();

  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const { data: campaign, isLoading } = useGetCampaign(campaignId, {
    query: { enabled: !!campaignId, queryKey: getGetCampaignQueryKey(campaignId) },
  });
  const { data: investments } = useListCampaignInvestments(campaignId, {
    query: { enabled: !!campaignId, queryKey: getListCampaignInvestmentsQueryKey(campaignId) },
  });

  const invest = useInvestInCampaign();
  const releaseEscrow = useReleaseEscrow();
  const cancelEscrow = useCancelEscrow();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId) });
    qc.invalidateQueries({ queryKey: getListCampaignInvestmentsQueryKey(campaignId) });
  };

  function handleInvest(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet.startsWith("r") || wallet.length < 25) {
      toast({ title: "Invalid wallet", description: "Enter a valid XRPL wallet address (starts with 'r')", variant: "destructive" });
      return;
    }
    const xrp = parseFloat(amount);
    if (!xrp || xrp <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid XRP amount", variant: "destructive" });
      return;
    }
    invest.mutate(
      { id: campaignId, data: { investorWallet: wallet, investorName: name || undefined, amount: xrp } },
      {
        onSuccess: () => {
          toast({ title: "Investment locked in escrow!", description: `${xrp} XRP secured on XRPL` });
          setWallet(""); setName(""); setAmount("");
          invalidate();
        },
        onError: (e: any) => toast({ title: "Error", description: e?.data?.error ?? "Failed to invest", variant: "destructive" }),
      }
    );
  }

  function handleRelease() {
    releaseEscrow.mutate({ id: campaignId }, {
      onSuccess: (d) => {
        toast({ title: "Escrow released!", description: `Funds sent to farmer. TX: ${d.txHash?.slice(0, 12)}...` });
        invalidate();
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error ?? "Cannot release", variant: "destructive" }),
    });
  }

  function handleCancel() {
    cancelEscrow.mutate({ id: campaignId }, {
      onSuccess: () => {
        toast({ title: "Campaign cancelled", description: "Investor funds are being returned" });
        invalidate();
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error ?? "Cannot cancel", variant: "destructive" }),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Button asChild variant="ghost" className="mt-4"><Link href="/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
      </div>
    );
  }

  const pct = Math.min(Math.round((campaign.currentAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, differenceInDays(parseISO(campaign.deadline), new Date()));
  const canInvest = campaign.status === "active";
  const canRelease = campaign.status === "funded";
  const canCancel = campaign.status === "active" || campaign.status === "expired";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto max-w-5xl px-4 py-10"
    >
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/campaigns"><ArrowLeft className="mr-2 h-4 w-4" />All Campaigns</Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero image */}
          <div className="aspect-video rounded-2xl overflow-hidden bg-card border border-border">
            {campaign.imageUrl ? (
              <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <Leaf className="h-16 w-16 text-primary/30" />
              </div>
            )}
          </div>

          {/* Title & meta */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary">{campaign.category}</Badge>
              <Badge variant="outline" className={campaign.status === "active" ? "text-primary border-primary/40" : ""}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{campaign.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{campaign.farmerName}</span>
              {campaign.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{campaign.location}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Deadline: {format(parseISO(campaign.deadline), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Description */}
          <Card className="bg-card/50">
            <CardHeader><CardTitle className="text-base">About this campaign</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{campaign.description}</p>
            </CardContent>
          </Card>

          {/* XRPL escrow info */}
          {campaign.escrowTxHash && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />XRPL Escrow</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Transaction Hash</span>
                  <a
                    href={`${XRPL_EXPLORER}${campaign.escrowTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline flex items-center gap-1 text-xs"
                  >
                    {campaign.escrowTxHash.slice(0, 16)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {campaign.escrowSequence && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Escrow Sequence</span>
                    <span className="font-mono text-xs">{campaign.escrowSequence}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Investments table */}
          {investments && investments.length > 0 && (
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Backers ({investments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {investments.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <div className="text-sm font-medium">{inv.investorName ?? "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{inv.investorWallet.slice(0, 12)}...{inv.investorWallet.slice(-6)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium text-sm">{inv.amount} XRP</div>
                        <EscrowStatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Funding progress */}
          <Card className="bg-card/50 sticky top-20">
            <CardContent className="pt-6 space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-mono font-bold text-xl text-primary">{campaign.currentAmount.toLocaleString()} XRP</span>
                  <span className="text-muted-foreground self-end">of {campaign.goalAmount.toLocaleString()} XRP</span>
                </div>
                <Progress value={pct} className="h-3 mt-2" />
                <div className="text-xs text-muted-foreground mt-1 text-right">{pct}% funded</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="font-bold text-lg font-mono">{campaign.investorCount}</div>
                  <div className="text-muted-foreground text-xs">Backers</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="font-bold text-lg font-mono">{daysLeft}</div>
                  <div className="text-muted-foreground text-xs">Days left</div>
                </div>
              </div>

              {/* Admin actions */}
              {(canRelease || canCancel) && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium">Campaign Actions</p>
                  {canRelease && (
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={handleRelease}
                      disabled={releaseEscrow.isPending}
                    >
                      {releaseEscrow.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Release Escrow to Farmer
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={handleCancel}
                      disabled={cancelEscrow.isPending}
                    >
                      {cancelEscrow.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CornerUpLeft className="mr-2 h-4 w-4" />}
                      Cancel &amp; Return Funds
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invest form */}
          {canInvest && (
            <Card className="bg-card/50">
              <CardHeader><CardTitle className="text-base">Back this campaign</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleInvest} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="wallet">Your XRPL Wallet Address</Label>
                    <Input
                      id="wallet"
                      placeholder="rXXX..."
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="iname">Your Name (optional)</Label>
                    <Input
                      id="iname"
                      placeholder="Jane Farmer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Amount (XRP)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={invest.isPending}>
                    {invest.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Locking in escrow...</>
                    ) : (
                      <><Lock className="mr-2 h-4 w-4" />Fund via XRPL Escrow</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Funds are locked in XRPL escrow until campaign goal is met
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
