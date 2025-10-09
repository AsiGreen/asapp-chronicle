import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down" | "neutral";
}

export const MetricCard = ({ title, value, change, icon: Icon, trend }: MetricCardProps) => {
  const trendColor = 
    trend === "up" ? "text-primary" : 
    trend === "down" ? "text-destructive" : 
    "text-muted-foreground";

  return (
    <Card className="card-elevated p-6 hover:border-glow transition-all duration-300 animate-fade-in group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className={`text-sm font-medium ${trendColor}`}>{change}</span>
      </div>
      <h3 className="text-sm text-muted-foreground mb-1 font-inter">{title}</h3>
      <p className="text-3xl font-bold font-orbitron text-glow">{value}</p>
    </Card>
  );
};
