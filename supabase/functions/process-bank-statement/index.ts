import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { statementId, fileUrl } = await req.json();
    console.log('Processing bank statement:', statementId, fileUrl);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get statement details
    const { data: statement, error: statementError } = await supabase
      .from('bank_statements')
      .select('*')
      .eq('id', statementId)
      .single();

    if (statementError) throw statementError;

    // Extract file path from URL (remove base URL part)
    const urlParts = fileUrl.split('/bank-statements/');
    if (urlParts.length < 2) throw new Error('Invalid file URL format');
    const filePath = urlParts[1];
    
    console.log('Downloading file from storage:', filePath);
    
    // Download file using Supabase Storage client (authenticated)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('bank-statements')
      .download(filePath);

    if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);
    if (!fileData) throw new Error('No file data received');

    let fileContent: string;
    let transactions: any[] = [];

    // Parse based on file type
    if (statement.file_type === 'csv') {
      fileContent = await fileData.text();
      transactions = await parseCSV(fileContent, statement.bank_name, lovableApiKey);
    } else {
      // For PDF, convert to base64 in chunks to avoid stack overflow
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      fileContent = btoa(binary);
      transactions = await parsePDF(fileContent, statement.bank_name, lovableApiKey);
    }

    console.log(`Extracted ${transactions.length} transactions`);

    // Insert transactions
    const transactionsToInsert = transactions.map(t => ({
      user_id: statement.user_id,
      transaction_date: t.date,
      merchant_name: t.merchant,
      category: t.category,
      original_amount: Math.abs(t.amount),
      original_currency: statement.currency,
      amount_ils: Math.abs(t.amount),
      transaction_type: t.type || 'regular',
      transaction_direction: t.direction,
      bank_statement_id: statementId,
      source_bank: statement.bank_name,
      description: t.description,
    }));

    if (transactionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (insertError) throw insertError;
    }

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.direction === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.direction === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Update statement
    const { error: updateError } = await supabase
      .from('bank_statements')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_cashflow: totalIncome - totalExpenses,
      })
      .eq('id', statementId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionsCount: transactions.length,
        totalIncome,
        totalExpenses,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing bank statement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function parseCSV(content: string, bankName: string, lovableApiKey: string | undefined): Promise<any[]> {
  console.log('=== CSV PARSING START ===');
  console.log('Bank name:', bankName);
  console.log('CSV content length:', content.length, 'bytes');
  
  const lines = content.split('\n').filter(line => line.trim());
  console.log('Total lines:', lines.length);
  
  if (lines.length < 2) {
    console.log('ERROR: CSV has less than 2 lines');
    return [];
  }

  // Log first few lines for debugging
  console.log('First 3 lines of CSV:');
  lines.slice(0, 3).forEach((line, idx) => {
    console.log(`Line ${idx}:`, line.substring(0, 200));
  });

  const transactions: any[] = [];
  const headers = lines[0].split(',').map(h => h.trim());
  console.log('CSV Headers:', headers);

  // Auto-detect CSV structure - match exact One Zero headers
  let dateCol = -1, descCol = -1, amountCol = -1, currencyCol = -1, directionCol = -1;
  
  // Find column indexes by checking exact header names for One Zero bank
  headers.forEach((header, idx) => {
    // Match "תאריך תנועה" (Transaction Date) specifically, not "תאריך ערך"
    if (header === 'תאריך תנועה' || header.toLowerCase().includes('transaction date')) dateCol = idx;
    if (header === 'תיאור' || header.toLowerCase().includes('description')) descCol = idx;
    if (header === 'סכום פעולה' || header.toLowerCase().includes('amount')) amountCol = idx;
    if (header === 'מטבע' || header.toLowerCase().includes('currency')) currencyCol = idx;
    if (header === 'חיוב/זיכוי') directionCol = idx;
  });

  // Fallback to typical One Zero column positions if not found in headers
  if (dateCol === -1) dateCol = 0;  // First column - תאריך תנועה
  if (descCol === -1) descCol = 3;  // Fourth column - תיאור
  if (amountCol === -1) amountCol = 4;  // Fifth column - סכום פעולה
  if (currencyCol === -1) currencyCol = 5;  // Sixth column - מטבע
  if (directionCol === -1) directionCol = 6;  // Seventh column - חיוב/זיכוי

  console.log('Detected columns:', { dateCol, descCol, amountCol, currencyCol, directionCol });

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    
    if (parts.length < 4) {
      console.log(`Skipping line ${i}: insufficient columns (${parts.length})`);
      continue;
    }

    try {
      const date = parts[dateCol]?.trim() || '';
      const description = parts[descCol]?.trim() || 'Unknown';
      const amountStr = parts[amountCol]?.trim() || '0';
      const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''));
      const currency = parts[currencyCol]?.trim() || 'ILS';
      const directionStr = parts[directionCol]?.trim() || '';
      
      // Determine direction: "זיכוי" = income, "חיוב" = expense
      let direction: 'income' | 'expense' = 'expense';
      if (directionStr === 'זיכוי' || directionStr.toLowerCase().includes('credit')) {
        direction = 'income';
      }

      if (isNaN(amount)) {
        console.log(`Skipping line ${i}: invalid amount "${amountStr}"`);
        continue;
      }

      transactions.push({
        date: convertDate(date),
        merchant: cleanMerchant(description),
        amount,
        currency,
        direction,
        category: guessCategory(description, direction),
        type: 'regular',
        description,
      });
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  console.log('=== CSV PARSING COMPLETE ===');
  console.log('Extracted transactions:', transactions.length);
  if (transactions.length > 0) {
    console.log('First transaction:', JSON.stringify(transactions[0]));
  }

  return transactions;
}

async function parsePDF(content: string, bankName: string, lovableApiKey: string | undefined): Promise<any[]> {
  console.log('Parsing PDF for bank:', bankName);
  // PDF parsing would use pdfjs-serverless and AI extraction here
  // For now, return empty array
  return [];
}

function convertDate(dateStr: string): string {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function cleanMerchant(description: string): string {
  // Remove RTL marks and extra whitespace
  let cleaned = description.replace(/[\u200F\u200E]/g, '').trim();
  
  // Extract meaningful part (text after the last slash)
  const parts = cleaned.split('/');
  if (parts.length > 1) {
    cleaned = parts[parts.length - 1].trim();
  }
  
  // Remove leading reference numbers (e.g., "117-2712169")
  cleaned = cleaned.replace(/^[\d\-\s]+/, '').trim();
  
  return cleaned || 'Unknown Merchant';
}

function guessCategory(description: string, direction: string): string {
  const lower = description.toLowerCase();
  
  if (direction === 'income') {
    if (lower.includes('salary') || lower.includes('משכורת')) return 'Salary';
    return 'Other Income';
  }
  
  // Expenses
  if (lower.includes('credit') || lower.includes('ישראכרט')) return 'Credit Card Payment';
  if (lower.includes('loan') || lower.includes('הלוואה')) return 'Loan Payment';
  if (lower.includes('fee') || lower.includes('דמי')) return 'Bank Fees';
  if (lower.includes('transfer') || lower.includes('העברה')) return 'Transfer';
  
  return 'Other';
}
