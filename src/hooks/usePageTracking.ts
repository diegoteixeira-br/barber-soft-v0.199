import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Maximum lengths matching database constraints
const MAX_PAGE_PATH_LENGTH = 500;
const MAX_REFERRER_LENGTH = 2000;
const MAX_USER_AGENT_LENGTH = 1000;
const MAX_SESSION_ID_LENGTH = 100;

function generateSessionId(): string {
  const stored = sessionStorage.getItem("tracking_session_id");
  if (stored && stored.length <= MAX_SESSION_ID_LENGTH) return stored;
  
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("tracking_session_id", newId);
  return newId;
}

// Truncate string to max length for safety
function truncate(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function usePageTracking(pagePath: string = "/") {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Validate page path - must exist and not be too long
        const sanitizedPath = truncate(pagePath, MAX_PAGE_PATH_LENGTH);
        if (!sanitizedPath || sanitizedPath.length === 0) return;

        const sessionId = generateSessionId();
        
        await supabase
          .from("page_visits")
          .insert({
            page_path: sanitizedPath,
            referrer: truncate(document.referrer, MAX_REFERRER_LENGTH),
            user_agent: truncate(navigator.userAgent, MAX_USER_AGENT_LENGTH),
            session_id: truncate(sessionId, MAX_SESSION_ID_LENGTH)
          });
      } catch (error) {
        // Silently fail - tracking should not break the app
      }
    };

    trackVisit();
  }, [pagePath]);
}
