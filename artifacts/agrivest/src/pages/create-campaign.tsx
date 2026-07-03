import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, Sprout } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";

const CATEGORIES = ["Grains", "Vegetables", "Fruits", "Livestock", "Aquaculture", "Coffee & Tea"];

export default function CreateCampaign() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const createCampaign = useCreateCampaign();

  const [form, setForm] = useState({
    title: "",
    description: "",
    farmerWallet: "",
    farmerName: "",
    goalAmount: "",
    deadline: "",
    category: CATEGORIES[0],
    imageUrl: "",
    location: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const goal = parseFloat(form.goalAmount);
    if (!goal || goal <= 0) {
      toast({ title: "Invalid goal", description: "Enter a positive XRP amount", variant: "destructive" });
      return;
    }
    if (!form.farmerWallet.startsWith("r") || form.farmerWallet.length < 25) {
      toast({ title: "Invalid wallet", description: "Enter a valid XRPL wallet address", variant: "destructive" });
      return;
    }

    createCampaign.mutate(
      {
        data: {
          title: form.title,
          description: form.description,
          farmerWallet: form.farmerWallet,
          farmerName: form.farmerName,
          goalAmount: goal,
          deadline: form.deadline,
          category: form.category,
          imageUrl: form.imageUrl || undefined,
          location: form.location || undefined,
        },
      },
      {
        onSuccess: (campaign) => {
          toast({ title: "Campaign created!", description: "Your campaign is now live on Agrivest" });
          qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          navigate(`/campaigns/${campaign.id}`);
        },
        onError: (e: any) => {
          toast({ title: "Error", description: e?.data?.error ?? "Failed to create campaign", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="py-12 px-4 flex-1">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Start a Campaign</h1>
          </div>
          <p className="text-muted-foreground">Post your agricultural project and raise XRP from global investors</p>
        </motion.div>

        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Project Details</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Organic Maize Farming — Nakuru 2025"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    required
                    minLength={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your farming project, how funds will be used, and expected returns..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    required
                    minLength={10}
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Nakuru, Kenya"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="imageUrl">Campaign Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={(e) => set("imageUrl", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Funding Goal</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="goal">Goal Amount (XRP) *</Label>
                    <Input
                      id="goal"
                      type="number"
                      min="1"
                      placeholder="5000"
                      value={form.goalAmount}
                      onChange={(e) => set("goalAmount", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deadline">Deadline *</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => set("deadline", e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Your XRPL Identity</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="farmerName">Farmer / Organization Name *</Label>
                  <Input
                    id="farmerName"
                    placeholder="John Kamau"
                    value={form.farmerName}
                    onChange={(e) => set("farmerName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="farmerWallet">XRPL Wallet Address *</Label>
                  <Input
                    id="farmerWallet"
                    placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    value={form.farmerWallet}
                    onChange={(e) => set("farmerWallet", e.target.value)}
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Funds will be released to this XRPL wallet when goal is met</p>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={createCampaign.isPending}>
                {createCampaign.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating campaign...</>
                ) : (
                  <><Sprout className="mr-2 h-4 w-4" />Launch Campaign</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
