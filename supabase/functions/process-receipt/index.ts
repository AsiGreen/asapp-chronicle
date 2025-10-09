import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing receipt image:', imageUrl);

    // Create Supabase client to get signed URL
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get signed URL for the image
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('receipts')
      .createSignedUrl(imageUrl.replace('receipts/', ''), 60);

    if (signedUrlError) {
      console.error('Error getting signed URL:', signedUrlError);
      throw signedUrlError;
    }

    console.log('Got signed URL, calling AI...');

    // Call Lovable AI with Gemini 2.5 Flash (supports vision)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a receipt OCR assistant. Extract structured data from grocery receipts accurately.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all information from this grocery receipt. Return the data in the exact format specified by the function.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: signedUrlData.signedUrl
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_receipt_data',
              description: 'Extract structured data from a grocery receipt',
              parameters: {
                type: 'object',
                properties: {
                  store_name: { type: 'string', description: 'Name of the store' },
                  receipt_date: { type: 'string', description: 'Date on the receipt in YYYY-MM-DD format' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Item name' },
                        quantity: { type: 'number', description: 'Quantity purchased' },
                        unit_price: { type: 'number', description: 'Price per unit' },
                        total_price: { type: 'number', description: 'Total price for this item' }
                      },
                      required: ['name', 'total_price']
                    }
                  },
                  subtotal: { type: 'number', description: 'Subtotal before tax' },
                  tax: { type: 'number', description: 'Tax amount' },
                  total: { type: 'number', description: 'Total amount paid' }
                },
                required: ['items', 'total']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_receipt_data' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const receiptData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted receipt data:', receiptData);

    return new Response(
      JSON.stringify({ success: true, data: receiptData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing receipt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
