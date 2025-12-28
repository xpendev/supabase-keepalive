import type { ExecutionContext, ScheduledEvent } from "@cloudflare/workers-types";

export interface Env {
  SUPABASE_KEEPALIVE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const url = env.SUPABASE_KEEPALIVE_URL;
    const apiKey = env.SUPABASE_ANON_KEY;

    if (!url) {
      console.error("SUPABASE_KEEPALIVE_URL is not set.");
      return;
    }

    if (!apiKey) {
      console.error("SUPABASE_ANON_KEY is not set.");
      return;
    }

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
      });
      console.log("Ping status:", res.status);
    } catch (err) {
      console.error("KeepAlive error:", err);
    }
  },
};

