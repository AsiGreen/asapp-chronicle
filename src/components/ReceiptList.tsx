import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ReceiptList = () => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error: any) {
      console.error('Error loading receipts:', error);
      toast({
        title: "Failed to load receipts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="card-elevated p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (receipts.length === 0) {
    return (
      <Card className="card-elevated p-6">
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold font-orbitron mb-2">No receipts yet</h3>
          <p className="text-muted-foreground font-inter">
            Scan your first grocery receipt to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-elevated p-6">
      <h2 className="text-2xl font-bold font-orbitron mb-6 text-glow">
        Recent Receipts
      </h2>

      <div className="space-y-4">
        {receipts.map((receipt) => (
          <div
            key={receipt.id}
            className="p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors bg-background/50"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold font-orbitron text-lg">
                  {receipt.store_name || "Unknown Store"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-inter mt-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(receipt.receipt_date)}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xl font-bold text-primary">
                <DollarSign className="h-5 w-5" />
                {receipt.total?.toFixed(2) || "0.00"}
              </div>
            </div>

            {receipt.subtotal && (
              <div className="flex items-center justify-between text-sm text-muted-foreground font-inter">
                <span>Subtotal: ${receipt.subtotal.toFixed(2)}</span>
                {receipt.tax && <span>Tax: ${receipt.tax.toFixed(2)}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
