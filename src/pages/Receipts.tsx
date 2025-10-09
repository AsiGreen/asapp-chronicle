import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { ReceiptList } from "@/components/ReceiptList";
import { User } from "@supabase/supabase-js";

export default function Receipts() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleReceiptProcessed = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-orbitron text-glow mb-2">
            Grocery Receipts
          </h1>
          <p className="text-muted-foreground font-inter">
            Track your grocery spending with AI-powered receipt scanning
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ReceiptScanner onReceiptProcessed={handleReceiptProcessed} />
          <ReceiptList key={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}
