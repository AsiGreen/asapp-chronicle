import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/finance";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;
      setCategories(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCategories();
  };

  return { categories, loading, error, refetch };
};
