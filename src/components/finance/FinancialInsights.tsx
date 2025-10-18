import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface FinancialInsightsProps {
  insights?: string[];
}

export const FinancialInsights = ({ insights = [] }: FinancialInsightsProps) => {
  const defaultInsights = [
    "Track your spending patterns by uploading bank statements regularly",
    "Set aside 20% of your income for savings to build an emergency fund",
    "Review your subscriptions and recurring payments to find potential savings",
  ];

  const displayInsights = insights.length > 0 ? insights : defaultInsights;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Financial Insights
        </CardTitle>
        <CardDescription>Smart recommendations for your finances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayInsights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {idx + 1}
              </div>
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
