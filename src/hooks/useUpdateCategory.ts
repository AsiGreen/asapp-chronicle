import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast, showSuccessToast } from "@/lib/errorHandling";

export const useUpdateCategory = () => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const updateCategory = async (
    transactionId: string,
    newCategory: string,
    onSuccess?: () => void
  ) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ category: newCategory })
        .eq("id", transactionId);

      if (error) throw error;

      showSuccessToast(toast, "Success", "Category updated successfully");
      onSuccess?.();
    } catch (error) {
      showErrorToast(toast, error as Error, "Failed to update category");
    } finally {
      setUpdating(false);
    }
  };

  return { updateCategory, updating };
};
