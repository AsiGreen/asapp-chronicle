import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Category } from "@/types/finance";
import { getCategoryIcon } from "@/lib/financeUtils";

interface CategorySelectorProps {
  currentCategory: string;
  availableCategories: Category[];
  onCategoryChange: (categoryName: string) => void;
}

export const CategorySelector = ({
  currentCategory,
  availableCategories,
  onCategoryChange,
}: CategorySelectorProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="p-0 h-auto font-normal hover:bg-transparent"
        >
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-accent transition-colors"
          >
            {currentCategory}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-popover z-50">
        <div className="grid gap-1 max-h-64 overflow-y-auto">
          {availableCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <Button
                key={cat.id}
                variant="ghost"
                className="justify-start"
                onClick={() => onCategoryChange(cat.name)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {cat.name}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
