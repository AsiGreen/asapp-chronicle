import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

interface ReceiptEditorProps {
  data: any;
  imageUrl: string;
  previewUrl: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ReceiptEditor = ({ data, imageUrl, previewUrl, onSave, onCancel }: ReceiptEditorProps) => {
  const [storeName, setStoreName] = useState(data.store_name || "");
  const [receiptDate, setReceiptDate] = useState(data.receipt_date || "");
  const [items, setItems] = useState(data.items || []);
  const [subtotal, setSubtotal] = useState(data.subtotal || 0);
  const [tax, setTax] = useState(data.tax || 0);
  const [total, setTotal] = useState(data.total || 0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          store_name: storeName,
          receipt_date: receiptDate || null,
          subtotal: subtotal || null,
          tax: tax || null,
          total: total
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Insert receipt items
      const itemsToInsert = items.map((item: any) => ({
        receipt_id: receipt.id,
        item_name: item.name,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || null,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Receipt saved!",
        description: "Your receipt has been saved successfully.",
      });

      onSave();

    } catch (error: any) {
      console.error('Error saving receipt:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="card-elevated p-6">
      <h2 className="text-2xl font-bold font-orbitron mb-6 text-glow">
        Review Receipt
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {previewUrl && (
          <div className="rounded-lg overflow-hidden border border-primary/20">
            <img
              src={previewUrl}
              alt="Receipt"
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="storeName" className="font-inter">Store Name</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div>
            <Label htmlFor="receiptDate" className="font-inter">Date</Label>
            <Input
              id="receiptDate"
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="font-inter">Subtotal</Label>
              <Input
                type="number"
                step="0.01"
                value={subtotal}
                onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                className="bg-background/50"
              />
            </div>
            <div>
              <Label className="font-inter">Tax</Label>
              <Input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="bg-background/50"
              />
            </div>
            <div>
              <Label className="font-inter">Total</Label>
              <Input
                type="number"
                step="0.01"
                value={total}
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                className="bg-background/50"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-bold font-orbitron">Items</h3>
        {items.map((item: any, index: number) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <Label className="font-inter text-xs">Item Name</Label>
              <Input
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="col-span-2">
              <Label className="font-inter text-xs">Qty</Label>
              <Input
                type="number"
                step="0.01"
                value={item.quantity || 1}
                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                className="bg-background/50"
              />
            </div>
            <div className="col-span-2">
              <Label className="font-inter text-xs">Unit $</Label>
              <Input
                type="number"
                step="0.01"
                value={item.unit_price || ''}
                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || null)}
                className="bg-background/50"
              />
            </div>
            <div className="col-span-2">
              <Label className="font-inter text-xs">Total $</Label>
              <Input
                type="number"
                step="0.01"
                value={item.total_price}
                onChange={(e) => updateItem(index, 'total_price', parseFloat(e.target.value) || 0)}
                className="bg-background/50"
              />
            </div>
            <div className="col-span-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Receipt"
          )}
        </Button>

        <Button
          onClick={onCancel}
          variant="outline"
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
};
