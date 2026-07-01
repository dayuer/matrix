---
slug: cycling-sdk-libraries
title: "Cycling SDK Libraries: Python, JS, Java"
metaTitle: "Cycling SDK Libraries: Python, JavaScript, Java Guide"
metaDescription: "Official cycling SDK libraries for Python, JavaScript, and Java. Stream IMU data at 100 Hz, call REST endpoints, and build cycling apps with the DIDI.BIKE SDKs."
cluster: integrations
isPillar: false
locale: en
focusKeyword: "cycling sdk libraries"
pillarSlug: cycling-data-ecosystem-guide
faqJson:
  - question: "Which programming languages have official DIDI.BIKE cycling SDKs?"
    answer: "DIDI.BIKE provides official SDKs for Python, JavaScript (Node.js and browser), and Java. All three SDKs expose the same functionality: WebSocket streaming at 100 Hz, REST endpoints for session history, raw 6-axis IMU access, and webhook helper utilities."
  - question: "Are the DIDI.BIKE cycling SDK libraries open source?"
    answer: "Yes. All official SDKs are open source under the MIT license and hosted on GitHub. You can inspect the code, submit issues, and contribute pull requests. The SDKs work with the $299 DIDI.BIKE Developer API."
  - question: "How do I install the Python cycling SDK?"
    answer: "Install the Python SDK with pip: run 'pip install dbbike'. The package supports Python 3.9 and later and includes optional pandas integration for returning IMU data as DataFrames."
  - question: "Do the SDKs handle WebSocket reconnection automatically?"
    answer: "Yes. All three SDKs implement automatic reconnection with exponential backoff. If the WebSocket connection drops, the SDK reconnects and resumes streaming without requiring application-level logic."
---

# Cycling SDK Libraries: Python, JS, Java

The DIDI.BIKE cycling SDK libraries give developers a clean, typed interface to the Developer API—WebSocket streaming at 100 Hz, REST endpoints for session history, raw 6-axis IMU access, and webhook utilities. Official SDKs are available for Python, JavaScript, and Java. We analyze installation, core APIs, and code examples for each language.

## Why Use an SDK Over Raw HTTP?

You can always call the REST and WebSocket APIs directly, but the SDKs save significant time by handling the tedious parts:

| Concern | Raw API | SDK |
|---------|---------|-----|
| Authentication | Manual header management | Automatic token injection |
| WebSocket reconnection | DIY backoff logic | Built-in auto-reconnect |
| JSON parsing | Manual deserialization | Typed objects / DataFrames |
| Pagination | Manual cursor handling | Iterator abstraction |
| Error handling | Raw status codes | Typed exceptions |
| Rate limiting | Manual retry | Built-in backoff |

For an overview of where SDKs fit in the broader ecosystem, see the [cycling data ecosystem guide](/en/blog/cycling-data-ecosystem-guide).

## SDK Comparison at a Glance

| Feature | Python | JavaScript | Java |
|---------|--------|------------|------|
| Package name | `dbbike` | `@didi.bike/sdk` | `bike:db:core` |
| Async model | asyncio | Promises / async-await | CompletableFuture |
| WebSocket | websockets | ws | Java-WebSocket |
| DataFrame support | pandas | — | — |
| Min version | Python 3.9 | Node 18 / ES2020 | Java 11 |

## Python SDK

### Installation

```bash
pip install dbbike
```

For pandas integration (recommended for analysis):

```bash
pip install "dbbike[pandas]"
```

### Connecting and Streaming

```python
from dbbike import dbBikeClient

client = dbBikeClient(api_key="dk_live_yourkey")

# Live stream IMU data at 100 Hz
def on_sample(sample):
    # sample is a typed IMUSample with ax, ay, az, gx, gy, gz, t
    print(f"az={sample.az:.3f} m/s²")

client.stream(device_id="dk_001", on_sample=on_sample)
```

The `stream` method opens a WebSocket and calls `on_sample` for each 100 Hz sample. The SDK handles reconnection automatically.

### Retrieving Historical Data

```python
# Get sessions for a device
sessions = client.list_sessions(device_id="dk_001")

# Download IMU data as a DataFrame
df = client.get_session_imu(
    session_id="dk_sess_482",
    format="dataframe"
)

print(df.head())
#                          t      ax      ay      az      gx      gy      gz
# 0 2026-06-23 14:00:00.000  0.012  -0.034   9.801  0.002  -0.015   0.008
# 1 2026-06-23 14:00:00.010  0.015  -0.031   9.798  0.003  -0.014   0.007
```

The DataFrame is indexed by timestamp and includes all six IMU channels, making it immediately ready for analysis, plotting, or export.

### Exporting Sessions

```python
client.export_session(
    session_id="dk_sess_482",
    format="fit",
    path="./ride_482.fit"
)
```

Export to FIT for import into [Golden Cheetah](/en/blog/golden-cheetah-cycling-analysis) or [Intervals.icu](/en/blog/intervals-icu-cycling).

## JavaScript SDK

### Installation

```bash
npm install @didi.bike/sdk
```

### Connecting and Streaming

```javascript
import { dbBike } from "@didi.bike/sdk";

const client = new dbBike({ apiKey: "dk_live_yourkey" });

await client.connect("dk_001");

client.onImu((sample) => {
  console.log(`az=${sample.az.toFixed(3)} m/s²`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await client.disconnect();
  process.exit(0);
});
```

The SDK works in both Node.js and the browser. In the browser, it uses the native WebSocket; in Node, it uses the `ws` package automatically.

### Async Iterator for Streaming

For consumers that prefer pull-based processing, the SDK exposes an async iterator:

```javascript
for await (const sample of client.imuStream("dk_001")) {
  processSample(sample);
}
```

### REST Calls

```javascript
const sessions = await client.listSessions({ deviceId: "dk_001" });
const imu = await client.getSessionImu("dk_sess_482", { format: "json" });
```

## Java SDK

### Installation (Maven)

```xml
<dependency>
  <groupId>bike.db</groupId>
  <artifactId>core</artifactId>
  <version>1.4.0</version>
</dependency>
```

### Connecting and Streaming

```java
import bike.db.dbBikeClient;
import bike.db.IMUSample;

dbBikeClient client = new dbBikeClient("dk_live_yourkey");

client.stream("dk_001", (IMUSample sample) -> {
    System.out.printf("az=%.3f m/s²%n", sample.getAz());
});

// Blocking call to keep the app alive
client.awaitDisconnect();
```

The Java SDK uses a callback interface for streaming and `CompletableFuture` for REST calls, fitting naturally into reactive and async applications.

### REST Calls

```java
CompletableFuture<List<Session>> sessions =
    client.listSessionsAsync("dk_001");

sessions.thenAccept(list -> {
    list.forEach(s -> System.out.println(s.getId()));
});
```

## Common Patterns Across SDKs

### Subscribing to Specific Channels

By default, `stream()` subscribes to all IMU channels. To receive only accelerometer data (reducing bandwidth):

```python
client.stream(device_id="dk_001", channels=["accel"], on_sample=on_sample)
```

### Filtering by Frequency

Request a decimated stream when full 100 Hz resolution is not needed:

```python
client.stream(device_id="dk_001", rate_hz=25, on_sample=on_sample)
```

### Handling Disconnections

All SDKs reconnect automatically with exponential backoff. You can register a callback for connection state changes:

```javascript
client.onConnectionStateChange((state) => {
  console.log(`Connection: ${state}`); // "connected" | "reconnecting" | "error"
});
```

## Building a Complete App

A typical cycling analytics app combines streaming, storage, and export. Here is a minimal Python example:

```python
from dbbike import dbBikeClient
import pandas as pd

client = dbBikeClient(api_key="dk_live_yourkey")
samples = []

def on_sample(sample):
    samples.append(sample.to_dict())

# Stream for the duration of a ride
client.stream(device_id="dk_001", on_sample=on_sample)

# After the ride: analyze
df = pd.DataFrame(samples)
df["t"] = pd.to_datetime(df["t"], unit="s")
vibration = df["az"].std()
print(f"Vertical vibration (std): {vibration:.4f} m/s²")
```

For real-time webhook integrations alongside streaming, see [cycling data webhooks](/en/blog/cycling-data-webhooks). For details on the underlying IMU data, see the [developer API raw IMU data](/en/blog/developer-api-raw-imu-data) guide.

## FAQ

### Which programming languages have official DIDI.BIKE cycling SDKs?
DIDI.BIKE provides official SDKs for Python, JavaScript (Node.js and browser), and Java. All three SDKs expose the same functionality: WebSocket streaming at 100 Hz, REST endpoints for session history, raw 6-axis IMU access, and webhook helper utilities.

### Are the DIDI.BIKE cycling SDK libraries open source?
Yes. All official SDKs are open source under the MIT license and hosted on GitHub. You can inspect the code, submit issues, and contribute pull requests. The SDKs work with the $299 DIDI.BIKE Developer API.

### How do I install the Python cycling SDK?
Install the Python SDK with pip: run 'pip install dbbike'. The package supports Python 3.9 and later and includes optional pandas integration for returning IMU data as DataFrames.

### Do the SDKs handle WebSocket reconnection automatically?
Yes. All three SDKs implement automatic reconnection with exponential backoff. If the WebSocket connection drops, the SDK reconnects and resumes streaming without requiring application-level logic.

## References
1. *Wireless Communications and Mobile Computing*: ANT+ vs BLE latency profiles in dynamic environments.
2. *DIDI.BIKE Technical Reprints*: API data retention, FIT file streaming, and developer SDK structures.
