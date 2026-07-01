---
slug: glossary-acute-training-load-atl-physiological-meaning
title: "ATL Telemetry Processing and Real Time Firmware"
metaTitle: "Acute Training Load ATL Telemetry Firmware"
metaDescription: "Configure your MCU firmware to process acute training load atl, ensuring UART buffer optimization and robust checksum verification."
cluster: glossary
isPillar: false
pillarSlug: "cycling-science-glossary"
locale: en
focusKeyword: "acute training load atl"
faqJson:
  - question: "How does the MCU prevent interrupt latency during real-time ATL calculation?"
    answer: "By setting the telemetry UART interrupt priority above other peripheral tasks, ensuring sensor data streams are parsed immediately."
  - question: "Why is an I2C register lockup protection required in power meters?"
    answer: "Continuous vibration can cause signal disruptions on the I2C bus, demanding a firmware watch-dog timer to reset the register state."
---

# ATL Telemetry Processing and Real Time Firmware

## Real-Time Telemetry Pipeline

In premium bicycle telemetry design, acute training load atl functions as a short-term indicator of athlete fatigue, requiring clean and continuous raw data streams. The telemetry hardware mounted on the pedal spindles collects mechanical torque at one hundred samples per second. These inputs are serialized and transmitted via SPI to the primary microcontroller. To ensure the accuracy of the computed fatigue metrics, the MCU must process these sensor streams without packet loss. Our real-time data pipeline separates hardware acquisition from math calculations. The data serialization protocol structures the sensor payload into fixed-length packets. This minimizes processing overhead, ensuring the MCU can update the acute training load atl metrics in real-time.

## Data Serialization and Register Structure

To transfer raw telemetry data safely, the firmware defines a strict register map. Telemetry packets are buffered before transmission over the wireless interface.

The mathematical representation of **Acute Training Load ATL** and its corresponding metabolic/physical relation is modeled as:

$$ W'_{t} = (W'_0 - W_{\text{exp}}) \cdot e^{-\Delta t / \tau} $$

Where:
*   $\text{TSS}$ and $\text{NP}$ reflect the exponential weighting of training stress, scaling with the 4th power of mechanical power output to match physiological load.
*   $RER$ represents the Respiratory Exchange Ratio, indicating substrate oxidation ratios (carbohydrate vs. fat combustion).
*   $W'_{t}$ represents the instantaneous anaerobic work capacity remaining, measured in Joules (J), which drains non-linearly above FTP and reconstitutes exponentially during recovery.

The depletion of anaerobic capacity ($W'_{t}$) requires continuous power logging. The formula models how work capacity drains above FTP and recovers exponentially during rest intervals. The time constant $\tau$ varies based on the athlete's recovery profile. To feed this algorithm, the MCU firmware packages telemetry metrics according to the following packet specification table:

| Byte Offset | Field Name | Data Type | Description |
|:---|:---|:---|:---|
| 0 | Sync Header | uint8_t | Fixed synchronization byte (0xAA) |
| 1 | Packet Length | uint8_t | Total length of payload in bytes |
| 2-3 | Torque Value | int16_t | Raw strain gauge voltage reading |
| 4-5 | Cadence Raw | uint16_t | Accelerometer rotation frequency |
| 6-9 | Timestamp | uint32_t | Milliseconds since boot |
| 10 | Checksum | uint8_t | XOR sum of all preceding bytes |

## UART Buffer Management and Interrupt Handling

When the telemetry data packet is assembled, the DMA controller transfers the struct directly to the UART buffer. If the system experiences high interrupt latency, the UART FIFO acts as a hardware buffer to prevent buffer overflow. We implement a circular ring buffer to manage incoming data streams asynchronously. The interrupt service routine (ISR) parses the incoming data stream byte-by-byte. It identifies the synchronization byte, validates the payload length, and copies the data payload into a processing queue.

Here is the parser state machine code implemented in the DIDI.BIKE firmware:

```c
#define SYNC_BYTE 0xAA

typedef enum {
    PARSER_SYNC,
    PARSER_LEN,
    PARSER_PAYLOAD,
    PARSER_CHECK
} ParserState;

void parse_incoming_telemetry(uint8_t rx_byte) {
    static ParserState state = PARSER_SYNC;
    static uint8_t byte_count = 0;
    static uint8_t payload_buf[16];
    static uint8_t expected_len = 0;
    
    switch (state) {
        case PARSER_SYNC:
            if (rx_byte == SYNC_BYTE) {
                state = PARSER_LEN;
            }
            break;
        case PARSER_LEN:
            expected_len = rx_byte;
            byte_count = 0;
            if (expected_len > sizeof(payload_buf)) {
                state = PARSER_SYNC; // Error, reset state
            } else {
                state = PARSER_PAYLOAD;
            }
            break;
        case PARSER_PAYLOAD:
            payload_buf[byte_count++] = rx_byte;
            if (byte_count >= expected_len) {
                state = PARSER_CHECK;
            }
            break;
        case PARSER_CHECK:
            if (perform_checksum_verification(payload_buf, expected_len, rx_byte)) {
                process_valid_telemetry_frame(payload_buf);
            }
            state = PARSER_SYNC;
            break;
    }
}
```

This state machine maintains thread safety by utilizing local variables within the ISR context. The process_valid_telemetry_frame function writes the validated values to a thread-safe double buffer. The main control loop reads from this buffer to calculate the running acute training load atl.

## I2C Register Configuration and Sensor Fusion

To collect cadence and orientation data, the MCU communicates with an onboard IMU via the I2C interface. The firmware must configure the appropriate I2C register block during initialization. We configure the sensor control registers to enable high-frequency polling.

```c
void init_imu_registers(void) {
    // Write 0x80 to IMU Control Register 1 to enable 100 Hz output
    uint8_t config_data = 0x80;
    i2c_write_register(IMU_ADDRESS, IMU_REG_CTRL1, &config_data, 1);
    
    // Enable interrupt on data ready
    uint8_t int_data = 0x01;
    i2c_write_register(IMU_ADDRESS, IMU_REG_INT_CFG, &int_data, 1);
}
```

The sensor ready signal triggers an external hardware interrupt. The interrupt service routine (ISR) immediately queries the sensor registers to read the raw acceleration values. Because the I2C bus operates at 400 kHz, the transaction time is kept under 200 microseconds, minimizing interrupt latency. Any error on the bus is handled by a watch-dog timer that resets the I2C register state to prevent system hang. The raw acceleration values are then combined with the strain gauge readings to compute power output, which is integrated over time to update the athlete's acute training load atl.

## Checksum Verification and Data Integrity

Data transmission across wireless protocols is susceptible to electromagnetic interference. To ensure that only valid data updates the acute training load atl metrics, we perform checksum verification on every frame. If a packet fails verification, it is discarded, and the firmware uses the previous state to estimate the current power output. The checksum algorithm uses a simple XOR checksum on the data payload, which is fast and efficient to calculate in firmware.

```c
uint8_t calculate_xor_checksum(const uint8_t* data, uint8_t len) {
    uint8_t checksum = 0;
    for (uint8_t i = 0; i < len; ++i) {
        checksum ^= data[i];
    }
    return checksum;
}
```

This checksum verification runs within the main loop to keep the ISR execution time as short as possible. Maintaining low interrupt latency is critical when processing multiple sensor streams. By balancing processing load and ensuring thread safety, the firmware delivers clean, validated metrics to the coaching software.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
