import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MAX_FILE_SIZE } from "@/constants/finance";

interface FileUpload {
  file: File;
  bankName: string;
  id: string;
}

interface ProcessingFile {
  id: string;
  fileName: string;
  bankName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  statementId?: string;
  error?: string;
}

export const BankStatementUpload = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle real-time subscription updates
  const handleRealtimeUpdate = useCallback((updatedStatement: any) => {
    console.log('Real-time update received:', updatedStatement);
    
    setProcessingFiles(prev => {
      const updated = prev.map(file => {
        if (file.statementId === updatedStatement.id) {
          console.log(`Updating file ${file.fileName} from status ${file.status} to ${updatedStatement.status}`);
          
          if (updatedStatement.status === 'completed') {
            // Immediately show toast and update state
            setTimeout(() => {
              toast({
                title: "Processing complete",
                description: `${file.fileName} has been processed successfully.`,
              });
            }, 0);
            
            return {
              ...file,
              progress: 100,
              status: 'completed' as const
            };
          } else if (updatedStatement.status === 'failed') {
            setTimeout(() => {
              toast({
                title: "Processing failed",
                description: `Failed to process ${file.fileName}`,
                variant: "destructive",
              });
            }, 0);
            
            return {
              ...file,
              progress: 100,
              status: 'failed' as const,
              error: 'Processing failed'
            };
          }
        }
        return file;
      });
      
      console.log('Updated processing files:', updated);
      return updated;
    });
  }, [toast]);

  // Subscribe to real-time updates for bank statement processing
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('bank-statements-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bank_statements',
            filter: `user_id=eq.${user.id}`
          },
          (payload: any) => {
            handleRealtimeUpdate(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [handleRealtimeUpdate]);

  // Fallback polling for files stuck at 70%
  useEffect(() => {
    const checkStuckFiles = async () => {
      const stuckFiles = processingFiles.filter(
        f => f.progress === 70 && f.status === 'processing' && f.statementId
      );

      if (stuckFiles.length === 0) return;

      console.log('Checking stuck files:', stuckFiles);

      for (const file of stuckFiles) {
        const { data: statement } = await supabase
          .from('bank_statements')
          .select('status')
          .eq('id', file.statementId)
          .single();

        if (statement) {
          console.log(`Polling result for ${file.fileName}:`, statement.status);
          
          if (statement.status === 'completed') {
            setProcessingFiles(prev => prev.map(f => 
              f.id === file.id 
                ? { ...f, progress: 100, status: 'completed' as const }
                : f
            ));
            
            toast({
              title: "Processing complete",
              description: `${file.fileName} has been processed successfully.`,
            });
          } else if (statement.status === 'failed') {
            setProcessingFiles(prev => prev.map(f => 
              f.id === file.id 
                ? { ...f, progress: 100, status: 'failed' as const, error: 'Processing failed' }
                : f
            ));
            
            toast({
              title: "Processing failed",
              description: `Failed to process ${file.fileName}`,
              variant: "destructive",
            });
          }
        }
      }
    };

    // Poll every 2 seconds if there are processing files
    if (processingFiles.some(f => f.status === 'processing')) {
      pollingIntervalRef.current = setInterval(checkStuckFiles, 2000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [processingFiles, toast]);

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

      // Initialize processing files
      const newProcessingFiles: ProcessingFile[] = files.map(f => ({
        id: f.id,
        fileName: f.file.name,
        bankName: f.bankName,
        progress: 0,
        status: 'uploading' as const,
      }));
      setProcessingFiles(prev => [...prev, ...newProcessingFiles]);

      for (let i = 0; i < files.length; i++) {
        const fileUpload = files[i];
        
        // Update to uploading (0-40%)
        setProcessingFiles(prev => prev.map(f => 
          f.id === fileUpload.id ? { ...f, progress: 10 } : f
        ));

        const fileExt = fileUpload.file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('bank-statements')
          .upload(filePath, fileUpload.file);

        if (uploadError) {
          setProcessingFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, progress: 100, status: 'failed' as const, error: uploadError.message } 
              : f
          ));
          throw uploadError;
        }

        // Upload complete (40%)
        setProcessingFiles(prev => prev.map(f => 
          f.id === fileUpload.id ? { ...f, progress: 40 } : f
        ));

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

        if (insertError) {
          setProcessingFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, progress: 100, status: 'failed' as const, error: insertError.message } 
              : f
          ));
          throw insertError;
        }

        // Database record created (50%), now processing
        setProcessingFiles(prev => prev.map(f => 
          f.id === fileUpload.id 
            ? { ...f, progress: 50, status: 'processing' as const, statementId: statement.id } 
            : f
        ));

        const { error: functionError } = await supabase.functions.invoke('process-bank-statement', {
          body: { statementId: statement.id, fileUrl: publicUrl },
        });

        if (functionError) {
          setProcessingFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, progress: 100, status: 'failed' as const, error: functionError.message } 
              : f
          ));
          throw functionError;
        }

        // Edge function invoked, animating progress (60-99%)
        setProcessingFiles(prev => prev.map(f => 
          f.id === fileUpload.id ? { ...f, progress: 70 } : f
        ));
      }

      toast({
        title: "Upload complete",
        description: `${files.length} statement(s) are being processed. Watch the progress below.`,
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

  const dismissProcessingFile = (id: string) => {
    setProcessingFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusBadge = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Uploading</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="w-3 h-3" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Failed</Badge>;
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

        {processingFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Processing Queue:</Label>
            {processingFiles.map((processingFile) => (
              <Card key={processingFile.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{processingFile.fileName}</p>
                        <p className="text-xs text-muted-foreground">{processingFile.bankName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(processingFile.status)}
                      {(processingFile.status === 'completed' || processingFile.status === 'failed') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dismissProcessingFile(processingFile.id)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={processingFile.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{processingFile.progress}%</span>
                      {processingFile.error && (
                        <span className="text-destructive">{processingFile.error}</span>
                      )}
                    </div>
                  </div>
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
