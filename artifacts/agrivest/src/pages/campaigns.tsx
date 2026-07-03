import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CampaignCard } from "@/components/campaign-card";
import { useListCampaigns } from "@workspace/api-client-react";

const CATEGORIES = ["All", "Grains", "Vegetables", "Fruits", "Livestock", "Aquaculture", "Coffee & Tea"];
const STATUSES = ["all", "active", "funded", "expired", "cancelled"] as const;

export default function Campaigns() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState<string>("all");

  const { data: campaigns, isLoading } = useListCampaigns(
    status !== "all" ? { status: status as any } : undefined
  );

  const filtered = (campaigns ?? []).filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      (c.location ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || c.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="py-12 px-4 flex-1">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Explore Campaigns</h1>
          <p className="text-muted-foreground">Discover agricultural projects seeking funding on the XRP Ledger</p>
        </motion.div>

        {/* Filters */}
        <div className="space-y-4 mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, farmers, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1" />
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  status === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No campaigns found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c, i) => (
              <CampaignCard key={c.id} campaign={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
