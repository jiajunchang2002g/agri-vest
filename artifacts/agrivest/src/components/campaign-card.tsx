import { Link } from "wouter";
import type { Campaign } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, MapPin, Clock } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { motion } from "framer-motion";

export function CampaignCard({ campaign, index = 0 }: { campaign: Campaign, index?: number }) {
  const percentFunded = Math.min(Math.round((campaign.currentAmount / campaign.goalAmount) * 100), 100);
  const daysLeft = Math.max(0, differenceInDays(parseISO(campaign.deadline), new Date()));

  const statusColors = {
    active: "bg-primary/20 text-primary border-primary/20",
    funded: "bg-accent/20 text-accent border-accent/20",
    expired: "bg-muted/50 text-muted-foreground border-muted",
    cancelled: "bg-destructive/20 text-destructive border-destructive/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/campaigns/${campaign.id}`}>
        <Card className="h-full overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group flex flex-col bg-card/50 backdrop-blur-sm">
          <div className="aspect-[16/9] relative overflow-hidden bg-muted">
            {campaign.imageUrl ? (
              <img 
                src={campaign.imageUrl} 
                alt={campaign.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
            <div className="absolute top-2 left-2 flex gap-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-md">
                {campaign.category}
              </Badge>
            </div>
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className={`backdrop-blur-md ${statusColors[campaign.status]}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            </div>
          </div>
          <CardHeader className="p-4 pb-2">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{campaign.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 line-clamp-1">
              {campaign.farmerName}
              {campaign.location && (
                <>
                  <span className="mx-1">•</span>
                  <MapPin className="h-3 w-3" />
                  {campaign.location}
                </>
              )}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-primary font-mono">{campaign.currentAmount.toLocaleString()} XRP</span>
                <span className="text-muted-foreground font-mono">of {campaign.goalAmount.toLocaleString()} XRP</span>
              </div>
              <Progress value={percentFunded} className="h-2" indicatorColor={percentFunded >= 100 ? "bg-accent" : "bg-primary"} />
              <div className="flex justify-between text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {campaign.investorCount || 0} Backers</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {daysLeft} Days left</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
