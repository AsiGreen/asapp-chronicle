import { Button } from "@/components/ui/button";
import { Database, TrendingUp, Brain, Heart } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <Database className="w-4 h-4 text-background" />
          </div>
          <span className="text-xl font-bold font-orbitron text-glow">ASAPP</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
            <Brain className="w-4 h-4 mr-2" />
            Insights
          </Button>
          <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
            <Heart className="w-4 h-4 mr-2" />
            Wellness
          </Button>
        </div>

        <Button className="bg-primary hover:bg-primary-glow text-background font-medium">
          Connect Data
        </Button>
      </div>
    </nav>
  );
};
