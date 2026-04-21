// Maps Supabase/PostgREST/Auth errors to safe user-facing messages.
// Always log the full error with console.error for diagnostics.
type AnyError = { code?: string; message?: string; status?: number; name?: string } | null | undefined;

export function safeErrorMessage(error: AnyError, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  // Log full detail for developers (browser console only)
  console.error("[error]", error);

  const code = error.code;
  const status = error.status;

  switch (code) {
    case "23505": return "This item already exists.";
    case "23503": return "Related record not found.";
    case "23502": return "A required field is missing.";
    case "23514": return "Some values are invalid.";
    case "42501": return "You do not have permission to perform this action.";
    case "PGRST301": return "You do not have permission to perform this action.";
    case "PGRST116": return "Item not found.";
  }

  if (status === 401 || status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Item not found.";
  if (status === 429) return "Too many requests. Please slow down.";
  if (typeof status === "number" && status >= 500) return "Service is temporarily unavailable. Please try again.";

  // Auth-specific friendly messages
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("invalid login")) return "Invalid email or password.";
  if (msg.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.includes("password")) return "Password does not meet requirements.";
  if (msg.includes("rate limit")) return "Too many requests. Please slow down.";

  return fallback;
}
