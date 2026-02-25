
# 🌫️ SmartSense – IoT Based Indoor Air Quality Monitoring System

## 📌 Overview
SmartSense is a real-time IoT-based Indoor Air Quality (IAQ) monitoring system built using ESP32. 
It measures PM2.5, temperature, pressure, and Carbon Monoxide levels, calculates PM2.5 based AQI, 
and uploads structured data to Firebase for remote monitoring worldwide.

---

## 🚀 Features

- 📊 Real-time AQI calculation
- 🌡️ Temperature monitoring (BMP280)
- 🌬️ PM2.5 measurement as the primary aqi parameter (PMS5003)
- 🧪 Carbon Monoxide detection (MQ-7)
- 📡 WiFi data upload to Firebase Realtime Database
- 🕒 Epoch timestamp logging
- 🖥️ OLED display output (128x64 SSD1306)
- ☁️ Cloud-ready structured JSON architecture

---

## 🛠️ Hardware Used

- ESP32 DevKit V1 (30 Pin)
- PMS5003 (Plantower) PM Sensor
- MQ-7 Gas Sensor Module
- BMP280 Temperature & Pressure Sensor
- 0.96” SSD1306 OLED Display (I2C)
- 5V 2A+ Stable Power Supply

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

## 📈 AQI Calculation

AQI is calculated based on PM2.5 concentration using standard breakpoint interpolation logic.

Ranges used:

| PM2.5 (µg/m³) | AQI Range |
|---------------|-----------|
| 0 – 30 | 0 – 50 |
| 31 – 60 | 51 – 100 |
| 61 – 90 | 101 – 200 |
| 91 – 120 | 201 – 300 |
| 121 – 250 | 301 – 400 |
| >250 | 500 |

---

## ☁️ Firebase Data Structure

Data is uploaded every 10 seconds in structured JSON format:

```
devices
 └── device01
      ├── aqi: 72
      ├── pm25: 40
      ├── temp: 31.2
      ├── co_status: "SAFE"
      └── timestamp: 1700000000
```

---

## 🔐 Firebase Rules (Recommended)

```
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

## 🧠 How It Works

1. ESP32 connects to WiFi
2. NTP sync retrieves epoch time
3. Sensors are read every 2 seconds
4. AQI is calculated from PM2.5
5. Data is displayed on OLED
6. Structured JSON is uploaded to Firebase

---

## ⚡ Power Requirements

Total current draw ≈ 500–600mA peak.

Use:
- 5V 2A minimum stable supply
- Avoid breadboard linear regulators for heater loads

---

## 📌 Future Improvements

- Historical data logging
- Web dashboard with graphs
- Threshold alerts
- Mobile app integration
- OTA firmware updates

---

## 👨‍💻 Author

- Kishor Kumar A
- Pratheerth Krishnan
- Saubhagya Kumar Singh
- Akshat Kumar Dewangan
- Aaron V Antony

---

## 📄 License

This project is open-source for academic and research purposes.

