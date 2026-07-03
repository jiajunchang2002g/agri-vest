import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sprout, Shield, TrendingUp, Globe, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaign-card";
import { useListCampaigns, useGetCampaignStats } from "@workspace/api-client-react";

export default function Home() {
  const { data: campaigns, isLoading } = useListCampaigns({ status: "active" });
  const { data: stats } = useGetCampaignStats();

  const featured = campaigns?.slice(0, 3) ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-3.5 w-3.5" />
              Powered by XRPL Escrow
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
              Fund the farms that<br />
              <span className="text-primary">feed the world</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Agrivest connects smallholder farmers with impact investors through trustless XRPL escrow. Every XRP raised is secured on-chain until harvest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/campaigns">Explore Campaigns <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8">
                <Link href="/campaigns/new">Raise Funds as a Farmer</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="border-y border-border/50 bg-card/30 py-10">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Total Campaigns", value: stats.totalCampaigns },
                { label: "Active Campaigns", value: stats.activeCampaigns },
                { label: "Total Investors", value: stats.totalInvestors },
                { label: "XRP Raised", value: `${stats.totalXrpRaised.toLocaleString()} XRP` },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold font-mono text-primary">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Campaigns */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold">Active Campaigns</h2>
              <p className="text-muted-foreground mt-1">Back a farmer, earn impact</p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/campaigns">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-xl bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((c, i) => (
                <CampaignCard key={c.id} campaign={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-card/20 border-t border-border/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-14">How Agrivest works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Sprout, title: "Farmer posts campaign", desc: "A farmer creates a campaign with their XRPL wallet, funding goal, deadline, and crop details." },
              { icon: Shield, title: "Investors back with XRP", desc: "Investors fund campaigns. XRP is locked in XRPL escrow — trustlessly secured until conditions are met." },
              { icon: TrendingUp, title: "Escrow released on success", desc: "When the goal is reached, escrow is released to the farmer. If it fails, funds return to investors." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
