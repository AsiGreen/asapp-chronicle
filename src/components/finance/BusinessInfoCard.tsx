import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, MapPin, ArrowRight, AlertCircle } from "lucide-react";
import { BusinessLookupResult } from "@/types/finance";

interface BusinessInfoCardProps {
  result: BusinessLookupResult;
  onAcceptCategory: (transactionId: string, newCategory: string) => void;
}

export const BusinessInfoCard = ({ result, onAcceptCategory }: BusinessInfoCardProps) => {
  const categoryChanged = result.suggestedCategory !== result.currentCategory;
  
  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.8) return "default";
    if (confidence >= 0.5) return "secondary";
    return "outline";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.5) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  if (result.loading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (result.error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">{result.merchantName}</p>
              <p className="text-sm">{result.error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-lg">{result.businessName}</h3>
            <Badge variant="outline">{result.businessType}</Badge>
          </div>
          {result.confidence > 0 && (
            <Badge variant={getConfidenceBadgeVariant(result.confidence)}>
              <span className={getConfidenceColor(result.confidence)}>
                {Math.round(result.confidence * 100)}% confident
              </span>
            </Badge>
          )}
        </div>

        {result.description && (
          <p className="text-sm text-muted-foreground">{result.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {result.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{result.location}</span>
            </div>
          )}
          {result.website && (
            <a
              href={result.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Website</span>
            </a>
          )}
        </div>

        {categoryChanged && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{result.currentCategory}</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge>{result.suggestedCategory}</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => onAcceptCategory(result.transactionId, result.suggestedCategory)}
              className="w-full"
            >
              Accept Category Change
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
