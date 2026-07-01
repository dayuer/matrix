---
slug: developer-api-raw-imu-data
title: "Developer API: Accessing Raw IMU Data"
metaTitle: "Cycling Sensor Developer API: Raw IMU Data Access"
metaDescription: "Access raw 6-axis IMU data via the cycling sensor developer API. WebSocket streaming at 100 Hz, REST endpoints, SDKs, and code examples for Python, JS, Java."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "cycling sensor developer api"
pillarSlug: cycling-data-ecosystem-guide
faqJson:
  - question: "What sampling rate does the DIDI.BIKE Developer API provide for IMU data?"
    answer: "The DIDI.BIKE Developer API streams raw 6-axis IMU data (3-axis accelerometer + 3-axis gyroscope) at 100 Hz via WebSocket. This means 100 samples per second per axis, giving developers high-resolution data for vibration, cadence, and surface analysis."
  - question: "How much does the DIDI.BIKE Developer API cost?"
    answer: "The DIDI.BIKE Developer API is available for $299. This includes access to WebSocket streaming, REST endpoints, SDKs for Python, JavaScript, and Java, and raw IMU channel access with no per-request metering."
  - question: "Which programming languages have official SDKs?"
    answer: "DIDI.BIKE provides official SDKs for Python, JavaScript (Node.js and browser), and Java. Community wrappers exist for Go and Rust. All SDKs expose the same WebSocket streaming and REST functionality."
  - question: "Can I access IMU data offline after a ride?"
    answer: "Yes. Sessions are stored server-side and retrievable via REST endpoints. You can download a full session's IMU data as JSON or CSV after the ride ends, which is useful for batch analysis and machine learning pipelines."
  - question: "What can I build with raw IMU data from a cycling sensor?"
    answer: "Common applications include road surface classification (smooth, rough, cobblestone), crash and incident detection, cadence estimation without a dedicated sensor, bike-fit analysis through vibration signatures, and fatigue monitoring over long rides."
---

# Developer API: Accessing Raw IMU Data

The DIDI.BIKE Developer API gives you direct access to raw 6-axis inertial measurement unit (IMU) data at 100 Hz over WebSocket, plus REST endpoints for session history. At $299, it is the most affordable way for developers and researchers to build custom cycling analytics on top of high-resolution sensor streams. We analyze the data model, streaming protocol, SDK usage, and practical applications.

## What the API Provides

### Sensor Channels

The IMU exposes six channels of data, sampled at 100 Hz:

| Channel | Axis | Unit | Range |
|---------|------|------|-------|
| Accelerometer | X, Y, Z | m/s² | ±16 g |
| Gyroscope | X, Y, Z | rad/s | ±2000 °/s |

The accelerometer measures linear acceleration including gravity. The gyroscope measures angular velocity. Together these six channels let you reconstruct orientation, detect vibration patterns, and classify motion.

### Streaming vs. Historical Access

| Access Mode | Transport | Use Case |
|-------------|-----------|----------|
| Live stream | WebSocket, 100 Hz | Real-time apps, dashboards |
| Historical | REST (JSON/CSV) | Post-ride analysis, ML training |
| Webhooks | HTTP POST | Event-driven integrations |

For an overview of how these fit together, see the [cycling data ecosystem guide](/en/blog/cycling-data-ecosystem-guide).

## Authentication

All requests require an API key passed in the `Authorization` header:

```
Authorization: Bearer dk_live_<your_key>
```

Generate keys from the developer dashboard. Keys are scoped per device and can be rate-limited.

## WebSocket Streaming

The live stream is the API's core feature. Connect to the WebSocket endpoint, subscribe to channels, and receive JSON messages at 100 Hz.

### Connection

```
wss://api.didi.bike/v1/stream?device_id=<id>&token=<token>
```

### Message Format

Each IMU sample arrives as a JSON object:

```json
{
  "t": 1719504000.123,
  "ax": 0.012,
  "ay": -0.034,
  "az": 9.801,
  "gx": 0.002,
  "gy": -0.015,
  "gz": 0.008
}
```

The `t` field is a Unix timestamp in seconds with millisecond precision. The `a*` fields are accelerometer readings in m/s², and `g*` fields are gyroscope readings in rad/s.

### WebSocket Client Example (JavaScript)

```javascript
const ws = new WebSocket(
  "wss://api.didi.bike/v1/stream?device_id=dk_001&token=dk_live_yourkey"
);

ws.onmessage = (event) => {
  const sample = JSON.parse(event.data);
  // Process 100 Hz sample: sample.ax, sample.ay, sample.az, sample.gx...
  processImuSample(sample);
};

ws.onopen = () => {
  ws.send(JSON.stringify({ cmd: "subscribe", channels: ["imu"] }));
};
```

At 100 Hz, you receive 100 messages per second. For bandwidth-constrained environments, you can request decimated streams at 50 Hz or 25 Hz.

## REST Endpoints

The REST API provides session management and historical data retrieval.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/sessions` | GET | List sessions for a device |
| `/v1/sessions/{id}` | GET | Session metadata |
| `/v1/sessions/{id}/imu` | GET | Full IMU data (JSON or CSV) |
| `/v1/sessions/{id}/export` | GET | Export as FIT/GPX |
| `/v1/devices` | GET | List registered devices |

### Example: Download a Session as CSV

```bash
curl -H "Authorization: Bearer dk_live_yourkey" \
  "https://api.didi.bike/v1/sessions/dk_sess_001/imu?format=csv" \
  -o session_001_imu.csv
```

The CSV contains columns: `timestamp, ax, ay, az, gx, gy, gz`.

## SDK Usage

Official SDKs handle authentication, reconnection, and message parsing. See the [cycling SDK libraries](/en/blog/cycling-sdk-libraries) guide for installation details.

### Python

```python
from dbbike import dbBikeClient

client = dbBikeClient(api_key="dk_live_yourkey")

# Live streaming
def on_sample(sample):
    print(sample["az"])  # vertical acceleration

client.stream(device_id="dk_001", on_sample=on_sample)

# Historical download
df = client.get_session_imu("dk_sess_001", format="dataframe")
```

The Python SDK returns IMU data as a pandas DataFrame, which is convenient for analysis and visualization.

### JavaScript

```javascript
import { dbBike } from "@didi.bike/sdk";

const client = new dbBike({ apiKey: "dk_live_yourkey" });

await client.connect("dk_001");
client.onImu((sample) => {
  console.log(sample.az);
});
```

### Java

```java
dbBikeClient client = new dbBikeClient("dk_live_yourkey");
client.stream("dk_001", sample -> {
    System.out.println(sample.getAz());
});
```

## Applications of Raw IMU Data

### Road Surface Classification

By analyzing vibration frequency content, you can classify road surface type. A simple approach uses the variance of the vertical acceleration ($a_z$) over a sliding window:

$$\sigma_z = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(a_{z,i} - \bar{a}_z)^2}$$

High $\sigma_z$ indicates rough surfaces like cobblestones; low values indicate smooth tarmac. More sophisticated approaches use FFT features fed into a classifier.

### Crash Detection

Sudden acceleration spikes followed by stillness indicate a crash. A threshold-based detector can trigger alerts:

```python
def detect_crash(samples, threshold=60.0):
    for s in samples:
        magnitude = (s["ax"]**2 + s["ay"]**2 + s["az"]**2) ** 0.5
        if magnitude > threshold:
            return True, s["t"]
    return False, None
```

### Cadence Estimation

Without a dedicated cadence sensor, you can estimate pedal revolutions from gyroscope periodicity. The vertical-axis gyroscope ($g_z$) oscillates with each pedal stroke; a zero-crossing counter on a filtered $g_z$ signal yields cadence.

### Bike Fit and Comfort Analysis

Sustained vibration at specific frequencies can indicate fit issues or equipment problems. Comparing IMU signatures across setups helps fitters quantify the effect of changes.

## Performance Considerations

At 100 Hz over six channels, a one-hour ride produces approximately 3.6 million samples. Consider these optimizations:

- **Batch processing** for historical data rather than per-sample loops
- **Downsampling** to 25 Hz for applications that do not need full resolution
- **Compression** of CSV exports (gzip is supported via the `Accept-Encoding` header)
- **Streaming filters** to subscribe only to channels you need

## Webhooks for Event-Driven Workflows

For applications that do not need continuous streaming, the API can push events to your server via webhooks. Register a callback URL, and the API will POST events like session start, crash detected, and session complete. See [cycling data webhooks](/en/blog/cycling-data-webhooks) for implementation details.

## FAQ

### What sampling rate does the DIDI.BIKE Developer API provide for IMU data?
The DIDI.BIKE Developer API streams raw 6-axis IMU data (3-axis accelerometer + 3-axis gyroscope) at 100 Hz via WebSocket. This means 100 samples per second per axis, giving developers high-resolution data for vibration, cadence, and surface analysis.

### How much does the DIDI.BIKE Developer API cost?
The DIDI.BIKE Developer API is available for $299. This includes access to WebSocket streaming, REST endpoints, SDKs for Python, JavaScript, and Java, and raw IMU channel access with no per-request metering.

### Which programming languages have official SDKs?
DIDI.BIKE provides official SDKs for Python, JavaScript (Node.js and browser), and Java. Community wrappers exist for Go and Rust. All SDKs expose the same WebSocket streaming and REST functionality.

### Can I access IMU data offline after a ride?
Yes. Sessions are stored server-side and retrievable via REST endpoints. You can download a full session's IMU data as JSON or CSV after the ride ends, which is useful for batch analysis and machine learning pipelines.

### What can I build with raw IMU data from a cycling sensor?
Common applications include road surface classification (smooth, rough, cobblestone), crash and incident detection, cadence estimation without a dedicated sensor, bike-fit analysis through vibration signatures, and fatigue monitoring over long rides.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
