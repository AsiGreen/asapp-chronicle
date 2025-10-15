import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { merchantName, category, amount, currency } = await req.json();
    
    if (!merchantName) {
      throw new Error('Merchant name is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Looking up merchant: ${merchantName}`);

    const prompt = `You are a business analyst assistant. Search the web for information about a business/merchant.

Merchant Name: ${merchantName}
${amount && currency ? `Transaction Details: Charged ${amount} ${currency} for ${category || 'unknown category'}` : ''}

Instructions:
1. Search the web for this business
2. Determine what type of business this is
3. Suggest the most appropriate category from this list:
   - Transportation
   - Accommodation
   - Shopping
   - Food & Dining
   - Services
   - Entertainment
   - Travel
   - Co-working
   - Health & Wellness
   - Technology
   - Other

4. Provide a brief description (2-3 sentences)
5. Include website and location if found
6. Rate your confidence level (0.0 to 1.0) based on how certain you are about the information

Return your answer in this JSON format only, no other text:
{
  "businessName": "Official business name",
  "businessType": "Type of business",
  "suggestedCategory": "Category from list above",
  "confidence": 0.85,
  "description": "Brief description",
  "website": "https://...",
  "location": "City, Country"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', content);

    // Extract JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lookup-merchant:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        businessName: '',
        businessType: 'Unknown',
        suggestedCategory: 'Other',
        confidence: 0,
        description: 'Unable to lookup business information at this time.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
