"use cleint";

import { useEffect, useState } from "react";

export function useToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/auth/supabase-token");
        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log("Error", err);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchToken();
  }, []);

  return { token, isLoading };
}