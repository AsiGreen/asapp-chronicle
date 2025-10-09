import { Database, Receipt } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <Database className="w-4 h-4 text-background" />
          </div>
          <span className="text-xl font-bold font-orbitron text-glow">ASAPP</span>
        </a>
        
        <div className="hidden md:flex items-center gap-6">
          <a href="/" className="text-foreground hover:text-primary transition-colors font-inter">
            Dashboard
          </a>
          <a href="/receipts" className="text-foreground hover:text-primary transition-colors font-inter flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Receipts
          </a>
        </div>
      </div>
    </nav>
  );
};
