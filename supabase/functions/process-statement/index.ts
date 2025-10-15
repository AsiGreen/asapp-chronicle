import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, statementId } = await req.json();
    console.log('Processing statement:', statementId, 'from:', fileUrl);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Download the PDF file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('credit-card-statements')
      .download(fileUrl);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw downloadError;
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Call Lovable AI to extract transaction data
    const prompt = `You are a financial transaction parser. Extract ALL transactions from this credit card statement.
The statement is in Hebrew and contains international transactions in multiple currencies.

For each transaction extract:
- Transaction date (format: YYYY-MM-DD)
- Payment date (format: YYYY-MM-DD)
- Merchant name (clean, standardized English name)
- Original amount and currency (€, $, ₪, USD, EUR, ILS)
- Exchange rate (if applicable, otherwise null)
- Final amount in ILS (₪)
- Transaction type (regular or refund - refunds have negative amounts)
- Any fees

Suggested categories based on merchant names:
Transportation, Accommodation, Shopping, Food & Dining, Services, Entertainment, Travel, Co-working, Health & Wellness, Technology, Other

Extract the card information:
- Last 4 digits of card number
- Card type (e.g., Mastercard Platinum)
- Statement date

Return structured data with all transactions.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:application/pdf;base64,${base64}` }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_transactions',
              description: 'Extract structured transaction data from credit card statement',
              parameters: {
                type: 'object',
                properties: {
                  card_last_4: { type: 'string', description: 'Last 4 digits of card' },
                  card_type: { type: 'string', description: 'Card type (e.g., Mastercard Platinum)' },
                  statement_date: { type: 'string', description: 'Statement date in YYYY-MM-DD format' },
                  total_amount: { type: 'number', description: 'Total statement amount in ILS' },
                  transactions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        transaction_date: { type: 'string', description: 'Transaction date YYYY-MM-DD' },
                        payment_date: { type: 'string', description: 'Payment date YYYY-MM-DD' },
                        merchant: { type: 'string', description: 'Merchant name' },
                        category: { type: 'string', description: 'Transaction category' },
                        original_amount: { type: 'number', description: 'Amount in original currency' },
                        original_currency: { type: 'string', description: 'Currency code (USD, EUR, ILS)' },
                        exchange_rate: { type: ['number', 'null'], description: 'Exchange rate if applicable' },
                        amount_ils: { type: 'number', description: 'Final amount in ILS' },
                        fee: { type: 'number', description: 'Transaction fee', default: 0 },
                        type: { type: 'string', enum: ['regular', 'refund'], description: 'Transaction type' }
                      },
                      required: ['transaction_date', 'merchant', 'category', 'original_amount', 'original_currency', 'amount_ils', 'type']
                    }
                  }
                },
                required: ['transactions', 'card_last_4']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_transactions' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', extractedData.transactions?.length, 'transactions');

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Update statement with extracted info
    const { error: updateError } = await supabase
      .from('statements')
      .update({
        card_number: `****${extractedData.card_last_4}`,
        card_type: extractedData.card_type || null,
        statement_date: extractedData.statement_date || new Date().toISOString().split('T')[0],
        total_amount: extractedData.total_amount || 0,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', statementId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating statement:', updateError);
      throw updateError;
    }

    // Insert all transactions
    const transactions = extractedData.transactions.map((t: any) => ({
      user_id: user.id,
      statement_id: statementId,
      transaction_date: t.transaction_date,
      payment_date: t.payment_date || t.transaction_date,
      merchant_name: t.merchant,
      category: t.category,
      original_amount: t.original_amount,
      original_currency: t.original_currency,
      exchange_rate: t.exchange_rate,
      amount_ils: t.amount_ils,
      fee: t.fee || 0,
      transaction_type: t.type,
      card_last_4: extractedData.card_last_4
    }));

    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactions);

    if (insertError) {
      console.error('Error inserting transactions:', insertError);
      throw insertError;
    }

    console.log('Successfully processed statement with', transactions.length, 'transactions');

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionCount: transactions.length,
        totalAmount: extractedData.total_amount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-statement function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});