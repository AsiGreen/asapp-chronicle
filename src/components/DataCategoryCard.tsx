import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface DataCategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  dataPoints: number;
}

export const DataCategoryCard = ({ title, description, icon: Icon, dataPoints }: DataCategoryCardProps) => {
  return (
    <Card className="card-elevated p-6 hover:border-glow transition-all duration-300 animate-fade-in group">
      <div className="mb-4">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2 font-orbitron">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 font-inter">{description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {dataPoints.toLocaleString()} data points
        </span>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-glow group/btn">
          View
          <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};
