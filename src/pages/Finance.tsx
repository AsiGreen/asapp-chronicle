import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { StatementUpload } from "@/components/finance/StatementUpload";
import { TransactionsTable } from "@/components/finance/TransactionsTable";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";
import { BankStatementUpload } from "@/components/finance/BankStatementUpload";
import { IncomeOutcomeReport } from "@/components/finance/IncomeOutcomeReport";
import { FinancialInsights } from "@/components/finance/FinancialInsights";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

const Finance = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-orbitron mb-2 text-glow">Finance Tracker</h1>
            <p className="text-muted-foreground">
              Upload and analyze your credit card statements
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="credit-cards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credit-cards">Credit Cards</TabsTrigger>
            <TabsTrigger value="bank-statements">Bank Statements</TabsTrigger>
            <TabsTrigger value="report">Income/Outcome Report</TabsTrigger>
          </TabsList>

          <TabsContent value="credit-cards" className="space-y-8">
            <StatementUpload />
            <FinanceDashboard />
            <TransactionsTable />
          </TabsContent>

          <TabsContent value="bank-statements" className="space-y-8">
            <BankStatementUpload />
            <TransactionsTable />
          </TabsContent>

          <TabsContent value="report" className="space-y-8">
            <FinancialInsights />
            <IncomeOutcomeReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Finance;