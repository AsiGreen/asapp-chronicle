import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { showErrorToast, showSuccessToast } from "@/lib/errorHandling";
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPE, STATEMENT_STATUS } from "@/constants/finance";

export const StatementUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== ACCEPTED_FILE_TYPE) {
      showErrorToast(toast, new Error("Please upload a PDF file"), "Invalid file type");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showErrorToast(toast, new Error("Maximum file size is 20MB"), "File too large");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from("credit-card-statements")
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      setProgress(50);

      // Create statement record
      const { data: statement, error: statementError } = await supabase
        .from("statements")
        .insert({
          user_id: user.id,
          file_url: fileName,
          statement_date: new Date().toISOString().split('T')[0],
          card_number: "****",
          total_amount: 0,
          status: STATEMENT_STATUS.PROCESSING,
        })
        .select()
        .single();

      if (statementError) throw statementError;
      setProgress(70);

      setUploading(false);
      setProcessing(true);

      // Process the statement with AI
      const { error: functionError } = await supabase.functions.invoke("process-statement", {
        body: {
          fileUrl: fileName,
          statementId: statement.id,
        },
      });

      if (functionError) throw functionError;

      setProgress(100);
      setProcessing(false);

      showSuccessToast(toast, "Success!", "Statement processed successfully");

      // Reload the page to show new data
      window.location.reload();
    } catch (error: any) {
      console.error("Error uploading statement:", error);
      showErrorToast(toast, error, "Failed to process statement");
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload Statement
        </CardTitle>
        <CardDescription>
          Upload your credit card statement PDF for automatic processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              id="statement-upload"
              className="hidden"
              accept={ACCEPTED_FILE_TYPE}
              onChange={handleFileUpload}
              disabled={uploading || processing}
            />
            <label
              htmlFor="statement-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              {uploading || processing ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {uploading
                    ? "Uploading..."
                    : processing
                    ? "Processing with AI..."
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF files only, max 20MB
                </p>
              </div>
              {(uploading || processing) && (
                <div className="w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </label>
          </div>
          {processing && (
            <div className="text-center text-sm text-muted-foreground">
              Our AI is extracting transaction data from your statement...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
