
const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Contact"
]);

export async function onRequestPost({ request, env }) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };

  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) {
    return new Response(JSON.stringify({
      ok: false,
      message: "Meta CAPI is not configured yet."
    }), { status: 503, headers });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({
      ok: false,
      message: "Invalid JSON."
    }), { status: 400, headers });
  }

  const eventName = String(body.event_name || "");
  const eventId = String(body.event_id || "").slice(0, 100);

  if (!ALLOWED_EVENTS.has(eventName) || !eventId) {
    return new Response(JSON.stringify({
      ok: false,
      message: "Unsupported event or missing event ID."
    }), { status: 400, headers });
  }

  let sourceUrl;

  try {
    sourceUrl = new URL(body.event_source_url);

    if (sourceUrl.protocol !== "https:") {
      throw new Error("Invalid URL");
    }
  } catch {
    return new Response(JSON.stringify({
      ok: false,
      message: "Invalid event source URL."
    }), { status: 400, headers });
  }

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: sourceUrl.toString(),
    action_source: "website",
    user_data: {
      client_user_agent: request.headers.get("user-agent") || ""
    },
    custom_data: body.content_name
      ? { content_name: String(body.content_name).slice(0, 200) }
      : undefined
  };

  const clientIp = request.headers.get("cf-connecting-ip");

  if (clientIp) {
    event.user_data.client_ip_address = clientIp;
  }

  const apiVersion = env.META_API_VERSION || "v26.0";

  const metaUrl =
    `https://graph.facebook.com/${apiVersion}/` +
    `${env.META_PIXEL_ID}/events` +
    `?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`;

  const payload = { data: [event] };

  if (env.META_TEST_EVENT_CODE) {
    payload.test_event_code = env.META_TEST_EVENT_CODE;
  }

  try {
    const response = await fetch(metaUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({
        ok: false,
        message: "Meta rejected the event. Check server logs."
      }), { status: 502, headers });
    }

    return new Response(JSON.stringify({
      ok: true,
      events_received: result.events_received ?? 1
    }), { status: 200, headers });

  } catch {
    return new Response(JSON.stringify({
      ok: false,
      message: "Could not reach Meta."
    }), { status: 502, headers });
  }
}
