import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Transaction, BusinessLookupResult } from "@/types/finance";
import { BusinessInfoCard } from "./BusinessInfoCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BusinessLookupDialogProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  results: BusinessLookupResult[];
  onCategoryUpdate: (transactionId: string, newCategory: string) => Promise<void>;
}

export const BusinessLookupDialog = ({
  open,
  onClose,
  transactions,
  results,
  onCategoryUpdate,
}: BusinessLookupDialogProps) => {
  const handleAcceptCategory = async (transactionId: string, newCategory: string) => {
    await onCategoryUpdate(transactionId, newCategory);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Business Lookup Results</DialogTitle>
          <DialogDescription>
            AI-powered business information for {transactions.length} selected transaction{transactions.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {results.map((result) => (
              <BusinessInfoCard
                key={result.transactionId}
                result={result}
                onAcceptCategory={handleAcceptCategory}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
