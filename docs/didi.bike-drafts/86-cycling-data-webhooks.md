---
slug: cycling-data-webhooks
title: "Cycling Data Webhooks and Real-Time Streaming"
metaTitle: "Cycling Data Webhooks: Real-Time Event Streaming"
metaDescription: "Build cycling data webhooks and real-time streaming integrations. Subscribe to ride events, crash alerts, and live sensor data with HTTP callbacks and WebSocket."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "cycling data webhooks"
pillarSlug: cycling-data-ecosystem-guide
faqJson:
  - question: "What is the difference between webhooks and WebSocket streaming for cycling data?"
    answer: "WebSocket streaming provides a continuous high-frequency data feed (100 Hz IMU samples), ideal for live dashboards and real-time analysis. Webhooks are HTTP callbacks triggered by discrete events (ride start, crash, ride end), ideal for integrations that only need to react to milestones rather than process every sample."
  - question: "How do I secure a cycling data webhook endpoint?"
    answer: "Verify the HMAC signature in the X-DB-Signature header against your webhook secret, use HTTPS for your callback URL, and validate the event type before processing. The DIDI.BIKE API signs every webhook payload with SHA-256."
  - question: "What events can I subscribe to with cycling data webhooks?"
    answer: "Supported events include ride.started, ride.paused, ride.resumed, ride.completed, crash.detected, zone.entered, and sensor.disconnected. You can subscribe to all events or filter to specific types per endpoint."
  - question: "Does the DIDI.BIKE API retry failed webhook deliveries?"
    answer: "Yes. Failed deliveries (non-2xx responses) are retried with exponential backoff: after 1 minute, 5 minutes, 30 minutes, 2 hours, and 6 hours, for a total of five attempts before the webhook is marked as failed."
---

# Cycling Data Webhooks and Real-Time Streaming

Cycling data webhooks let your application react to ride events—starts, stops, crashes, zone entries—without polling an API or maintaining a persistent connection. Paired with WebSocket streaming for high-frequency sensor data, webhooks form the backbone of event-driven cycling integrations. We analyze webhook setup, payload formats, security, and how webhooks complement the DIDI.BIKE Developer API's streaming capabilities.

## Webhooks vs. WebSocket Streaming

Two mechanisms move data from the DIDI.BIKE API to your server. Choosing the right one depends on whether you need every sample or just key events.

| Feature | Webhooks | WebSocket Streaming |
|---------|----------|---------------------|
| Transport | HTTP POST callback | Persistent WebSocket |
| Data volume | Low (events only) | High (100 Hz IMU) |
| Latency | Seconds | Milliseconds |
| Use case | Integrations, alerts | Live dashboards, analysis |
| Complexity | Simple endpoint | Connection management |

For a full comparison of data access patterns, see the [cycling data ecosystem guide](/en/blog/cycling-data-ecosystem-guide).

## Setting Up Webhooks

### Step 1: Create an Endpoint

Create an HTTPS endpoint on your server that accepts POST requests. It should respond with a 2xx status code quickly—within 5 seconds—to avoid timeout retries.

```javascript
const express = require("express");
const app = express();
app.use(express.json());

app.post("/webhooks/db", (req, res) => {
  const event = req.body;
  // Process event asynchronously
  handleEvent(event);
  res.status(200).json({ received: true });
});
```

### Step 2: Register the Webhook

Register your endpoint with the API:

```bash
curl -X POST https://api.didi.bike/v1/webhooks \
  -H "Authorization: Bearer dk_live_yourkey" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/db",
    "events": ["ride.started", "ride.completed", "crash.detected"]
  }'
```

The API returns a webhook ID and a signing secret. Store the secret securely; you will use it to verify payloads.

### Step 3: Verify Signatures

Every webhook includes an `X-DB-Signature` header containing an HMAC-SHA256 signature of the payload. Verify it before processing:

```python
import hmac, hashlib

def verify_signature(payload_body, signature_header, secret):
    expected = hmac.new(
        secret.encode(),
        payload_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
```

Reject any request whose signature does not match. This prevents spoofed events from triggering actions in your system.

## Webhook Events and Payloads

### Supported Events

| Event | Trigger | Typical Use |
|-------|---------|-------------|
| `ride.started` | Session begins | Start downstream recording |
| `ride.paused` | Rider pauses | Update status display |
| `ride.resumed` | Rider resumes | Resume recording |
| `ride.completed` | Session ends | Trigger analysis pipeline |
| `crash.detected` | IMU spike detected | Send safety alert |
| `zone.entered` | aivfence crossing | Coaching notifications |
| `sensor.disconnected` | Device drops | Warn rider |

### Payload Format

Each webhook delivers a JSON payload with consistent structure:

```json
{
  "event_id": "evt_abc123",
  "event_type": "crash.detected",
  "timestamp": "2026-06-23T14:32:07.123Z",
  "device_id": "dk_001",
  "session_id": "dk_sess_482",
  "data": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "magnitude_g": 62.4,
    "confidence": 0.94
  }
}
```

The `data` object varies by event type. The envelope fields (`event_id`, `event_type`, `timestamp`, `device_id`, `session_id`) are always present.

## Building a Crash Alert System

A common webhook application is automated crash detection with emergency alerts.

```python
def handle_crash_event(event):
    if event["event_type"] != "crash.detected":
        return
    
    data = event["data"]
    if data["confidence"] < 0.85:
        return  # Low-confidence, skip
    
    # Send alert with location
    send_emergency_sms(
        contact=emergency_contact,
        message=f"Possible crash detected at "
                f"{data['latitude']}, {data['longitude']}"
    )
```

Because the DIDI.BIKE API streams IMU data at 100 Hz via WebSocket (see [raw IMU data access](/en/blog/developer-api-raw-imu-data)), crash detection runs server-side and the webhook fires only when confidence is high. Your application does not need to process the raw stream itself.

## Combining Webhooks With Streaming

The most robust integrations use both mechanisms together:

1. **Webhook** for `ride.started` — your app opens a WebSocket connection to receive live IMU data.
2. **WebSocket** streams 100 Hz samples to a live dashboard during the ride.
3. **Webhook** for `crash.detected` — triggers an immediate alert, even if the dashboard is not being watched.
4. **Webhook** for `ride.completed` — your app closes the WebSocket, downloads the full session via REST, and kicks off analysis.

This hybrid pattern keeps real-time latency low while ensuring no event is missed.

## Retry and Reliability

The API retries failed deliveries with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 6 hours |

After the sixth attempt, the webhook is marked as failed and you receive an email notification. You can view delivery history and manually replay events from the developer dashboard.

### Handling Duplicates

Network retries can cause duplicate deliveries. Use the `event_id` field for idempotency—track processed IDs and skip duplicates:

```python
processed_ids = set()

def handle_event(event):
    if event["event_id"] in processed_ids:
        return
    processed_ids.add(event["event_id"])
    # Process event
```

## Best Practices

- **Respond fast.** Return 2xx within 5 seconds; process heavy work asynchronously.
- **Use a queue.** For high-volume event processing, push events to a message queue (Redis, SQS) and handle them with workers.
- **Log everything.** Store raw payloads for debugging and replay.
- **Monitor failures.** Alert your team when delivery failure rates spike.
- **Version your handlers.** The API includes a schema version in each payload; write handlers that check it before processing.

## FAQ

### What is the difference between webhooks and WebSocket streaming for cycling data?
WebSocket streaming provides a continuous high-frequency data feed (100 Hz IMU samples), ideal for live dashboards and real-time analysis. Webhooks are HTTP callbacks triggered by discrete events (ride start, crash, ride end), ideal for integrations that only need to react to milestones rather than process every sample.

### How do I secure a cycling data webhook endpoint?
Verify the HMAC signature in the X-DB-Signature header against your webhook secret, use HTTPS for your callback URL, and validate the event type before processing. The DIDI.BIKE API signs every webhook payload with SHA-256.

### What events can I subscribe to with cycling data webhooks?
Supported events include ride.started, ride.paused, ride.resumed, ride.completed, crash.detected, zone.entered, and sensor.disconnected. You can subscribe to all events or filter to specific types per endpoint.

### Does the DIDI.BIKE API retry failed webhook deliveries?
Yes. Failed deliveries (non-2xx responses) are retried with exponential backoff: after 1 minute, 5 minutes, 30 minutes, 2 hours, and 6 hours, for a total of five attempts before the webhook is marked as failed.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
