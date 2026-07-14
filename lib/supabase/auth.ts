import { cache } from "react";
import { createClient } from "./server";

// Deduplicate the authenticated-user lookup within a single server render.
// React's `cache` memoizes per request, so the layout and the page can both
// call this and only pay one network round trip to the auth server.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
