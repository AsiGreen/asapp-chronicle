import { PostgrestError } from "@supabase/supabase-js";

export const formatSupabaseError = (error: PostgrestError | Error): string => {
  if ('code' in error && 'message' in error) {
    // PostgrestError
    return error.message || "An unexpected error occurred";
  }
  return error.message || "An unexpected error occurred";
};

export const showErrorToast = (
  toast: any,
  error: PostgrestError | Error | unknown,
  fallbackMessage: string = "An error occurred"
) => {
  const message = error instanceof Error 
    ? formatSupabaseError(error)
    : fallbackMessage;

  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
};

export const showSuccessToast = (
  toast: any,
  message: string,
  description?: string
) => {
  toast({
    title: message,
    description,
  });
};
