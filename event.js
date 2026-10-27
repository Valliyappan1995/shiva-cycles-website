const ALLOWED_EVENTS = new Set(["PageView", "ViewContent", "Contact"]);

export async function onRequestPost({ request, env }) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };

  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) {
    return new Response(JSON.stringify({
      ok: false,
      message: "CAPI is not configured yet. Add META_PIXEL_ID and META_CAPI_TOKEN in Cloudflare Pages settings."
    }), { status: 503, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, message: "Invalid JSON." }), { status: 400, headers });
  }

  const eventName = String(body.event_name || "");
  const eventId = String(body.event_id || "").slice(0, 100);
  if (!ALLOWED_EVENTS.has(eventName) || !eventId) {
    return new Response(JSON.stringify({ ok: false, message: "Unsupported event or missing event ID." }), { status: 400, headers });
  }

  const pageUrl = String(body.event_source_url || "");
  let parsedUrl;
  try {
    parsedUrl = new URL(pageUrl);
    if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") throw new Error("invalid");
  } catch {
    return new Response(JSON.stringify({ ok: false, message: "Invalid event source URL." }), { status: 400, headers });
  }

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: parsedUrl.toString(),
    action_source: "website",
    user_data: {
      client_user_agent: request.headers.get("user-agent") || ""
    },
    custom_data: body.content_name ? { content_name: String(body.content_name).slice(0, 200) } : undefined
  };

  // Cloudflare may provide the visitor IP. Do not collect or forward extra personal data unnecessarily.
  const clientIp = request.headers.get("cf-connecting-ip");
  if (clientIp) event.user_data.client_ip_address = clientIp;

  const apiVersion = env.META_API_VERSION || "v26.0";
  const url = `https://graph.facebook.com/${apiVersion}/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`;
  const payload = { data: [event] };
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE;

  try {
    const metaResponse = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await metaResponse.json();
    if (!metaResponse.ok) {
      // Avoid returning secrets or full upstream details to the browser.
      return new Response(JSON.stringify({ ok: false, message: "Meta rejected the event. Check Cloudflare logs and Events Manager settings." }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ ok: true, events_received: result.events_received ?? 1 }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ ok: false, message: "Could not reach Meta. Try again later." }), { status: 502, headers });
  }
}

export async function onRequest({ request }) {
  return new Response(JSON.stringify({ ok: false, message: "Use POST for event delivery." }), {
    status: 405,
    headers: { "content-type": "application/json", "allow": "POST" }
  });
}
