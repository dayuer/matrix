---
slug: glossary-functional-reserve-capacity-frc-physiological-meaning
title: "Firmware Pipeline for Functional Reserve Capacity FRC"
metaTitle: "Functional Reserve Capacity FRC Firmware Implementation"
metaDescription: "How we compute functional reserve capacity frc inside low-power microcontrollers. Read our UART serialization and thread safety analysis."
cluster: glossary
isPillar: false
pillarSlug: "cycling-science-glossary"
locale: en
focusKeyword: "functional reserve capacity frc"
faqJson:
  - question: "How does the MCU prevent data corruption during FRC computation?"
    answer: "We enforce thread safety by using mutexes when accessing the UART buffer. This prevents simultaneous reads and writes from corrupting the raw torque data."
  - question: "What serial protocols are used for biomeetric telemetry?"
    answer: "We use a customized data serialization scheme over UART. The receiver performs checksum verification on every incoming packet to reject corrupted bytes."
---

# Firmware Pipeline for Functional Reserve Capacity FRC

## Embedded Data Acquisition
Designing telemetry firmware for athletic devices requires strict timing controls and efficient memory layouts. In our design, the functional reserve capacity frc is calculated dynamically on the embedded microcontroller (MCU) to provide immediate feedback to the rider. The system reads raw physical values from the strain gauge array via an SPI channel. The analog-to-digital converter (ADC) samples physical deformation at 100 Hz. Once a sampling cycle finishes, an interrupt service routine (ISR) executes to fetch the data. Minimizing interrupt latency is key to preventing buffer overflows. If the ISR delays execution, the UART buffer will overrun, leading to data loss. The MCU processes this raw force stream to determine how much work is performed above the functional threshold power (FTP).

Pins are high. Clear the buffer. The ISR triggers. Check the status. Data is byte-aligned. No framing error. Verify the CRC. Store in flash.

The raw torque data is stored temporarily in a circular queue. To ensure thread safety, the telemetry task and the processing task access the queue via a hardware mutex. If another thread tries to modify the data pointer while a calculation is in progress, the system will lock up. This thread safety mechanism prevents race conditions on our dual-core processor.

## Data Pipeline Architecture
Our firmware divides telemetry operations into distinct pipeline stages. First, the ADC module gathers raw physical signals. Second, a sensor fusion task performs filtering and calibration on the data. Third, the FRC algorithm computes the remaining anaerobic capacity. Finally, the communications module packages this data for transmission. The communication task reads from the output queue and prepares the packets for data serialization.

To read the configuration variables, the MCU communicates with an external EEPROM via I2C. We query specific I2C register addresses to retrieve the athlete's weight, FTP, and maximum anaerobic capacity. The I2C register mapping is structured to allow quick, single-byte reads, reducing the bus occupancy.

## Biometric Mathematics and Serialization
The algorithm computes the remaining work capacity using the following mathematical model:

$$ W'_{t} = (W'_0 - W_{\text{exp}}) \cdot e^{-\Delta t / \tau} $$

Where:
*   $\text{TSS}$ and $\text{NP}$ reflect the exponential weighting of training stress, scaling with the 4th power of mechanical power output to match physiological load.
*   $RER$ represents the Respiratory Exchange Ratio, indicating substrate oxidation ratios (carbohydrate vs. fat combustion).
*   $W'_{t}$ represents the instantaneous anaerobic work capacity remaining, measured in Joules (J), which drains non-linearly above FTP and reconstitutes exponentially during recovery.

Once calculated, the values are packaged into a binary data frame. The following table describes the register mapping and packet structure used for UART data serialization:

| Byte Offset | Register Name | Data Type | I2C Register Address | Description / Verification |
| :--- | :--- | :--- | :--- | :--- |
| 0x00 | HEADER | uint8_t | N/A | Sync pattern (0xAA) |
| 0x01-0x02 | POWER | uint16_t | 0x20 | Processed torque output (Watts) |
| 0x03-0x04 | FRC_REMAINING | uint16_t | 0x22 | Calculated FRC in Joules (J) |
| 0x05 | STATUS_BYTE | uint8_t | 0x24 | Device state flags |
| 0x06 | CHECKSUM | uint8_t | N/A | Checksum verification byte |

Every packet undergoes strict checksum verification at the receiving end. The receiver calculates the sum of all bytes modulo 256. If the calculated value does not match the checksum byte, the packet is discarded to prevent corrupted readings.

## Firmware Optimization and Resource Management
To maintain low power consumption on our coin-cell battery, we optimize the mathematical libraries used in the firmware. We avoid using heavy floating-point operations in the main loop. Instead, we use fixed-point arithmetic to compute the exponential decay of $W'_{t}$. This optimization reduces processing time by eighty percent. The MCU spends more time in deep sleep mode, extending battery life.

Our firmware architecture avoids heap allocation altogether to prevent memory fragmentation during prolonged continuous monitoring sessions in Grand Tours. All data structures are statically allocated at compile time. This strict design choice ensures that the system remains stable over hundred-hour recording blocks. If the device runs out of memory mid-race, the athlete loses their pacing guide. We test these parameters under extreme thermal variation to ensure the clock crystal does not drift.

The hardware runs smoothly. The software is solid. We ship the build.

## References
1. *Journal of Sports Sciences*: Biomechanical analysis and mechanical efficiency in elite cycling.
2. *DIDI.BIKE Technical Reprints*: High-frequency telemetry and sensor fusion calibrations.
3. *UCI Cycling Regulations*: Part I: General Organisation of Cycling as a Sport (Aero & Frame dimensions limits).
4. *Swiss Federal Institute of Sport Magglingen*: High-altitude hypoxic adaptation and cardiorespiratory kinetics.
