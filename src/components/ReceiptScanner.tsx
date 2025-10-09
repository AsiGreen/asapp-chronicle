import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReceiptEditor } from "./ReceiptEditor";

interface ReceiptScannerProps {
  onReceiptProcessed: () => void;
}

export const ReceiptScanner = ({ onReceiptProcessed }: ReceiptScannerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
    }
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setProcessing(true);

    try {
      // Upload image to storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      setImageUrl(fileName);

      // Call edge function to process receipt
      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { imageUrl: fileName }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractedData(data.data);
      
      toast({
        title: "Receipt processed!",
        description: "Review and edit the extracted data before saving.",
      });

    } catch (error: any) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveComplete = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setImageUrl(null);
    onReceiptProcessed();
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setImageUrl(null);
  };

  if (extractedData && imageUrl) {
    return (
      <ReceiptEditor
        data={extractedData}
        imageUrl={imageUrl}
        previewUrl={previewUrl}
        onSave={handleSaveComplete}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Card className="card-elevated p-6">
      <h2 className="text-2xl font-bold font-orbitron mb-6 text-glow">
        Scan Receipt
      </h2>

      {!previewUrl ? (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32"
            variant="outline"
          >
            <Camera className="mr-2 h-6 w-6" />
            Take Photo
          </Button>

          <Button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e: any) => handleFileSelect(e);
              input.click();
            }}
            className="w-full h-32"
            variant="outline"
          >
            <Upload className="mr-2 h-6 w-6" />
            Upload Image
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-primary/20">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="w-full h-auto"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={processReceipt}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Receipt"
              )}
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
