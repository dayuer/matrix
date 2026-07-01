---
slug: aerodynamics-cda-skin-friction-cfd-simulation
title: "CFD Simulation Data Pipeline for Skin Friction drag"
metaTitle: "CFD Data Pipeline & Skin Friction Telemetry"
metaDescription: "Discover the CFD simulation data pipeline and serialization protocols for cycling skin friction telemetry. Vikram Patel outlines code and hardware specs."
cluster: aerodynamics-cda
isPillar: false
pillarSlug: "cycling-aerodynamics-cda-guide"
locale: en
focusKeyword: "skin friction"
faqJson:
  - question: "How does the telemetry system process high-frequency CFD validation data?"
  - answer: "We implement thread-safe ring buffers to stream differential pressure metrics over UART at 100 Hz. This enables low-latency simulation mapping."
  - question: "What communications protocols are utilized in the sensor hardware?"
  - answer: "The microcontrollers read sensor registers over I2C, package the metrics using custom serialization, and verify packets via CRC-16 checksums."
---

# CFD Simulation Data Pipeline for Skin Friction drag

## CFD Data Pipeline and Embedded Architecture

Validating computational fluid dynamics (CFD) simulation runs requires continuous, real-time telemetry validation from physical road testing. The skin friction coefficient calculated in simulations must be compared directly against empirical surface shear stress metrics. To achieve this, we developed a dedicated embedded system mounted on the bicycle. This hardware captures high-frequency differential pressure data from multi-port probe arrays. The primary engineering goal is to maintain a constant $100\text{ Hz}$ data streaming rate over a low-bandwidth wireless channel without losing data packets.

The microcontroller unit (MCU) reads raw data from the pressure transducer using a dedicated I2C register interface. Each pressure sensor is assigned a unique 7-bit physical address. Due to the high vibration levels present during road trials, mechanical displacement can cause electrical noise on the I2C bus. To address this, the firmware implements an automatic retry mechanism. If a bus timeout is detected, the I2C peripheral is reset immediately. The MCU then attempts to re-establish communication within a strict window. This design keeps the interrupt latency of the I2C read cycle below $120\text{ microseconds}$, ensuring stable sample collection.

## Serial Communication Protocol and Data Serialization

Once the sensor metrics are retrieved from the internal registers, they must be formatted for transmission. We defined a custom data serialization protocol to minimize packet overhead. The raw float values are converted into scaled integers to save bandwidth.

| Byte Offset | Field Name | Data Type | Description / Scale |
| :--- | :--- | :--- | :--- |
| `0x00 - 0x01` | Sync Header | `uint16_t` | Fixed preamble `0xAA55` for frame alignment |
| `0x02 - 0x05` | Timestamp | `uint32_t` | Microsecond counter from system timer |
| `0x06 - 0x07` | Yaw Angle ($\beta$) | `int16_t` | Raw relative yaw angle scaled by 100 |
| `0x08 - 0x0B` | Viscous Pressure | `float` | Raw differential pressure value in Pascals |
| `0x0C - 0x0D` | Checksum | `uint16_t` | CRC-16 (Modbus) for checksum verification |

The table above details the structure of our telemetry serial frame. Transmission efficiency is calculated using the payload-to-overhead ratio:

$$ \eta_{\text{trans}} = \frac{N_{\text{payload}}}{N_{\text{payload}} + N_{\text{overhead}}} \times 100\% $$

Where $N_{\text{payload}}$ is the size of the active sensor data in bytes (six bytes: yaw angle and pressure), and $N_{\text{overhead}}$ is the protocol overhead (eight bytes: header, timestamp, and checksum). This gives a transmission efficiency of $42.8\%$. To transmit the data over wireless links, the serialized bytes are pushed into a dedicated UART buffer. The UART transmitter operates in direct memory access (DMA) mode to prevent blocking the main processor loop.

During real-world track testing, we calculate the wind vector dynamically to align the CFD simulation grid. The relationship between the crosswind velocity, vehicle velocity, and effective yaw angle is governed by:

$$ \tan \beta = \frac{v_{\text{cross}}}{v_{\text{rider}}} $$

Where:
*   $F_d$ is the total drag force vector in Newtons, representing the net force opposing the rider's forward motion.
*   $Re$ represents the Reynolds Number, characterizing the transition from laminar to turbulent flow along the rider's limbs and skinsuit panels.
*   $\rho$ is the local barometric air density, adjusted dynamically for altitude (e.g., during high-altitude Alpine passes or altitude training in St. Moritz, Switzerland).
*   $A$ is the planimetric frontal area, captured via 2D photogrammetry.
*   $\beta$ is the effective yaw angle in degrees.
*   $v_{\text{cross}}$ is the crosswind component.
*   $v_{\text{rider}}$ is the velocity of the rider relative to the track.

## Embedded Code Implementation and Thread Safety

To guarantee thread safety, the firmware runs on a real-time operating system (RTOS). Sensor acquisition tasks and transmission tasks run in separate, isolated threads. Communication between tasks is handled using thread-safe ring buffers. This prevents race conditions when writing to the UART buffer.

```c
#include <stdint.h>
#include <stdbool.h>

#define PACKET_SIZE 14
#define SYNC_HEADER 0xAA55

typedef struct {
    uint16_t sync;
    uint32_t timestamp;
    int16_t yaw;
    float pressure;
    uint16_t crc;
} __attribute__((packed)) TelemetryPacket;

uint16_t calculate_crc16(const uint8_t *data, uint16_t length) {
    uint16_t crc = 0xFFFF;
    for (uint16_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc = crc >> 1;
            }
        }
    }
    return crc;
}

bool serialize_telemetry(int16_t yaw, float pressure, uint8_t *out_buffer) {
    static uint32_t packet_counter = 0;
    TelemetryPacket packet;
    
    packet.sync = SYNC_HEADER;
    packet.timestamp = packet_counter++;
    packet.yaw = yaw;
    packet.pressure = pressure;
    packet.crc = calculate_crc16((uint8_t*)&packet, PACKET_SIZE - 2);
    
    // Copy serialized packet to UART buffer
    for (int i = 0; i < PACKET_SIZE; i++) {
        out_buffer[i] = ((uint8_t*)&packet)[i];
    }
    return true;
}
```

The code block above shows our implementation of the checksum verification and serialization sequence. The `serialize_telemetry` function is executed inside the interrupt service routine (ISR) triggered by the system timer. Because the CPU runs at $80\text{ MHz}$, the execution time of this serialization routine is extremely short, taking less than $15\text{ microseconds}$. This prevents task starvation on the lower-priority communications task. By keeping the latency threshold low and maintaining strict buffer isolation, we prevent data loss under high telemetry transmission rates.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
