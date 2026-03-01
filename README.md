# 🌫️ SmartSense – Advanced IoT Indoor Air Quality Monitoring System

![ESP32](https://img.shields.io/badge/ESP32-000000?logo=espressif&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-Academic-lightgrey)

## 📌 Overview

SmartSense is a production-grade IoT-based Indoor Air Quality (IAQ) monitoring system built on the ESP32 platform with real-time cloud integration.
It measures particulate matter (PM1.0, PM2.5, PM10), temperature, pressure, and Carbon Monoxide levels in real-time.

The system:

- Calculates AQI using breakpoint interpolation
- Uploads structured data to Firebase Realtime Database
- Maintains rolling historical data (1 hour / 24 hours / 7 days)
- Generates threshold-based alerts
- Powers a live web dashboard with analytics

This project demonstrates a scalable, cloud-integrated IoT architecture with real-time data ingestion, aggregation layers, rolling retention logic, and intelligent alert handling.

---

## 🧰 Tech Stack

- **Microcontroller:** ESP32 (Arduino Framework)
- **Sensors:** PMS5003, MQ-7, BMP280
- **Cloud Backend:** Firebase Realtime Database
- **Frontend:** React + Vite
- **Styling:** TailwindCSS
- **Deployment:** Firebase Hosting
- **Firmware Language:** C++ (Arduino)

---

## 📂 Project Structure

```
Smartsense
    ├── frontend/ # React + Vite dashboard
    ├── firmware/ # ESP32 Arduino firmware
    ├── firebase.json
    ├── .firebaserc 
    └── README.md
```

---

## 🏗️ System Architecture

[ ESP32 Sensors ]
          ↓
[ AQI Calculation + Aggregation ]
          ↓
[ Firebase Realtime Database ]
          ↓
[ Web Dashboard (Analytics + Alerts) ]

---

## 🚀 Features

### 🔴 Real-Time Monitoring
- AQI calculation (PM2.5 & PM10 based)
- PM1.0 / PM2.5 / PM10 readings (PMS5003)
- Temperature & Pressure (BMP280)
- Carbon Monoxide status (MQ-7)
- Live device heartbeat system
- Epoch timestamp logging

### 📊 Multi-Layer Data Architecture
Data is structured into 4 layers:

1. **Live Snapshot**
2. **Raw 10-second data (1-hour rolling window)**
3. **1-minute aggregated buckets (24-hour rolling window)**
4. **10-minute aggregated buckets (7-day rolling window)**

This enables scalable frontend analytics without overloading Firebase.

### 🚨 Intelligent Alert System
- AQI Severe Alert (AQI > 300)
- CO HIGH Alert
- Alert deduplication (prevents spam)
- 7-day alert retention

### ☁️ Cloud Architecture
- Firebase Realtime Database integration
- Structured JSON uploads
- Automatic data retention
- Device online/offline detection

### 🖥️ User Interface
- 128x64 SSD1306 OLED display
- Live data visualization
- Status indicators
- Cloud-powered web dashboard

---

## 🛠️ Hardware Used

| Component | Model |
|-----------|--------|
| Microcontroller | ESP32 DevKit V1 (30 Pin) |
| PM Sensor | PMS5003 (Plantower) |
| CO Sensor | MQ-7 Gas Sensor Module |
| Temp & Pressure | BMP280 |
| Display | 0.96” SSD1306 OLED |
| Power Supply | 5V 2A Stable Adapter |

---

## 🔌 Pin Configuration

### I2C (OLED + BMP280)
- SDA → GPIO 21  
- SCL → GPIO 22  

### PMS5003
- TX → GPIO 4  
- RX → GPIO 5  
- VCC → 5V  
- GND → GND  

### MQ-7
- AO → GPIO 19  
- VCC → 5V  
- GND → GND  

---

## 📈 AQI Calculation Logic

AQI is calculated using Indian breakpoint interpolation logic.

The final AQI value is:
AQI = max(AQI_PM2.5, AQI_PM10)


### PM2.5 Breakpoints

| PM2.5 (µg/m³) | AQI Range |
|---------------|-----------|
| 0 – 30 | 0 – 50 |
| 31 – 60 | 51 – 100 |
| 61 – 90 | 101 – 200 |
| 91 – 120 | 201 – 300 |
| 121 – 250 | 301 – 400 |
| >250 | 500 |

### PM10 Breakpoints

| PM10 (µg/m³) | AQI Range |
|--------------|-----------|
| 0 – 50       | 0 – 50    |
| 51 – 100     | 51 – 100  |
| 101 – 250    | 101 – 200 |
| 251 – 350    | 201 – 300 |
| 351 – 430    | 301 – 400 |
| >430         | 500       |

---

## ☁️ Firebase Database Architecture

```
devices
└── device01
    ├── live
    │   ├── aqi
    │   ├── co_status
    │   ├── pm1
    │   ├── pm10
    │   ├── pm25
    │   ├── pressure
    │   ├── temp 
    │   └── timestamp
    │
    ├── raw_10s
    │   └── {epoch}
    │       ├── aqi
    │       ├── co_status
    │       ├── pm1
    │       ├── pm10
    │       ├── pm25
    │       ├── pressure
    │       ├── temp 
    │       └── timestamp
    │
    ├── bucket_1min
    │   └── {epoch}
    │       ├── avg
    │       ├── count
    │       ├── max
    │       └── min
    │
    ├── bucket_10min
    │   └── {epoch}
    │       ├── avg
    │       ├── count
    │       ├── max
    │       └── min
    │
    └── alerts
        └── {epoch}
            ├── type
            ├── value 
            └── timestamp
```
---

## 📦 Sample JSON Upload (Live Snapshot)

```json
{
  "aqi": 52.68966,
  "co_status": "SAFE",
  "pm1": 21,
  "pm10": 35,
  "pm25": 32,
  "pressure": 1006.1272,
  "temp": 26.09,
  "timestamp": 1772179164
}
```

---

## ⏱️ Data Retention Logic

| Data Type | Stored Every | Retained For |
|------------|--------------|--------------|
| Live | 10 sec | Always |
| Raw 10s | 10 sec | 1 hour |
| 1-min bucket | 1 min | 24 hours |
| 10-min bucket | 10 min | 7 days |
| Alerts | Event based | 7 days |

Old data is automatically deleted to maintain rolling windows.

---

## 🌐 Web Dashboard Features

The cloud dashboard includes:

- Real-time live metrics
- 1 Hour graph (raw 10s data)
- 24 Hour graph (1-min buckets)
- 7 Day graph (10-min buckets)
- Metric toggling (AQI / PM1 / PM2.5 / PM10)
- Device online/offline status
- Alert history page

---

## 🧠 System Workflow

1. ESP32 boots
2. Connects to WiFi
3. Syncs NTP time
4. Reads sensors every 2 seconds
5. Calculates AQI
6. Updates OLED display
7. Uploads structured JSON every 10 seconds
8. Updates rolling aggregations
9. Triggers alerts if thresholds exceeded

---

## 🔐 Recommended Firebase Rules

```json
{
  "rules": {
    "devices": {
      "$deviceId": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```
---

## ⚡ Power Requirements

Estimated peak current draw: 500–600mA

Use:

- 5V 2A stable power supply
- Avoid weak USB ports
- Avoid linear regulators for heater-based sensors

---

## 🧑‍💻 Development Setup

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

### Deploy to Firebase

```bash
firebase deploy
```

### Arduino Firmware

Open firmware/ArduinoCode.ino in Arduino IDE.

---

## 🔮 Future Enhancements

- Multi-device support
- OTA firmware updates
- Push notifications (FCM)
- Historical export (CSV)
- AQI category color mapping
- Role-based authentication

---

## 🏁 Project Status

- Stable
- Fully Cloud Integrated
- Production-Ready IoT Architecture
- Actively Maintained

---

## 👨‍💻 Authors

- Kishor Kumar A
- Pratheerth Krishnan
- Saubhagya Kumar Singh
- Akshat Kumar Dewangan
- Aaron V Antony

---

## 📄 License

- Open-source for academic and research use.
- Commercial deployment requires authorization.
