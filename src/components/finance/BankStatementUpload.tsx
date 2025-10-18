import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MAX_FILE_SIZE } from "@/constants/finance";

interface FileUpload {
  file: File;
  bankName: string;
  id: string;
}

export const BankStatementUpload = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        return false;
      }
      
      const validTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} must be CSV or PDF`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    const newFiles = validFiles.map(file => ({
      file,
      bankName: detectBankName(file.name),
      id: Math.random().toString(36).substring(7),
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const detectBankName = (fileName: string): string => {
    if (fileName.includes('One_Zero') || fileName.includes('OneZero')) {
      return 'One Zero';
    }
    if (fileName.includes('Millennium') || fileName.includes('BCP')) {
      return 'Millennium BCP';
    }
    return 'Unknown Bank';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateBankName = (id: string, bankName: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, bankName } : f));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (let i = 0; i < files.length; i++) {
        const fileUpload = files[i];
        
        toast({
          title: `Processing ${i + 1} of ${files.length}`,
          description: `Uploading ${fileUpload.file.name}...`,
        });

        const fileExt = fileUpload.file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('bank-statements')
          .upload(filePath, fileUpload.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('bank-statements')
          .getPublicUrl(filePath);

        const { data: statement, error: insertError } = await supabase
          .from('bank_statements')
          .insert({
            user_id: user.id,
            bank_name: fileUpload.bankName,
            file_url: publicUrl,
            file_type: fileUpload.file.type.includes('pdf') ? 'pdf' : 'csv',
            statement_date_from: new Date().toISOString().split('T')[0],
            statement_date_to: new Date().toISOString().split('T')[0],
            currency: 'ILS',
            status: 'processing',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const { error: functionError } = await supabase.functions.invoke('process-bank-statement', {
          body: { statementId: statement.id, fileUrl: publicUrl },
        });

        if (functionError) throw functionError;
      }

      toast({
        title: "Upload complete",
        description: `${files.length} statement(s) are being processed. This may take a few minutes.`,
      });

      setFiles([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload bank statements",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Bank Statements</CardTitle>
        <CardDescription>
          Upload CSV or PDF bank statements to analyze your income and expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="bank-statement-upload">Select Files (CSV or PDF)</Label>
          <div className="flex gap-2">
            <Input
              id="bank-statement-upload"
              type="file"
              accept=".csv,.pdf"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="flex-1"
            />
            <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Files to Upload:</Label>
            {files.map((fileUpload) => (
              <Card key={fileUpload.id} className="p-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileUpload.file.name}</p>
                    <Input
                      value={fileUpload.bankName}
                      onChange={(e) => updateBankName(fileUpload.id, e.target.value)}
                      placeholder="Bank name"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(fileUpload.id)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Maximum file size: 20MB. Supported formats: CSV, PDF
        </p>
      </CardContent>
    </Card>
  );
};
