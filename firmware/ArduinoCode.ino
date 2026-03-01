//******************************************************
/*
 NOTE:
 This repository contains documentation firmware.
 All credentials are placeholders.
 Replace with your own configuration before deployment.
 Refer Readme.md for deployment information
 Made for ESP32 Dev Module
*/
//******************************************************

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_BMP280.h>
#include <time.h>
#include <esp_task_wdt.h>

// ==========================================================
// WIFI & FIREBASE
// ==========================================================

#define WIFI_SSID     "<YOUR_WIFI_SSID>"
#define WIFI_PASSWORD "<YOUR_WIFI_PASSWORD>"

#define API_KEY       "<YOUR_API_KEY>"
#define DATABASE_URL  "<YOUR_DATABASE_URL>"

FirebaseData   fbdo;
FirebaseAuth   auth;
FirebaseConfig config;

// ==========================================================
// DISPLAY
// ==========================================================

#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ==========================================================
// PINS
// ==========================================================

#define SDA_PIN  21
#define SCL_PIN  22
#define MQ7_PIN  19
#define PMS_RX   4
#define PMS_TX   5

// ==========================================================
// SENSORS
// ==========================================================

Adafruit_BMP280 bmp;
HardwareSerial  pmsSerial(2);

bool bmp_ok = false;

// ==========================================================
// ROLLING AGGREGATION TIMERS
// ==========================================================

unsigned long lastMinuteEpoch    = 0;
unsigned long lastTenMinuteEpoch = 0;

// 1-Minute Aggregator
float min1 = 9999, max1 = 0, sum1 = 0;
int   count1 = 0;

// 10-Minute Aggregator
float min10 = 9999, max10 = 0, sum10 = 0;
int   count10 = 0;

// ==========================================================
// SENSOR VALUES
// ==========================================================

float pm25_value = 0;
float pm10_value = 0;
float pm1_value  = 0;

unsigned long lastPmsUpdate      = 0;
unsigned long sendDataPrevMillis = 0;

// ==========================================================
// ALERT FLAGS
// ==========================================================

bool aqiAlertActive = false;
bool coAlertActive  = false;

// ==========================================================
// AQI CALCULATION (PM2.5 - Indian Breakpoints)
// ==========================================================

float calculateAQI_PM25(float pm25)
{
    if (pm25 <= 30)
        return (50.0 / 30.0) * pm25;

    else if (pm25 <= 60)
        return ((100 - 51.0) / (60 - 31.0)) * (pm25 - 31) + 51;

    else if (pm25 <= 90)
        return ((200 - 101.0) / (90 - 61.0)) * (pm25 - 61) + 101;

    else if (pm25 <= 120)
        return ((300 - 201.0) / (120 - 91.0)) * (pm25 - 91) + 201;

    else if (pm25 <= 250)
        return ((400 - 301.0) / (250 - 121.0)) * (pm25 - 121) + 301;

    else
        return 500;
}

// ==========================================================
// AQI CALCULATION (PM10 - Indian Breakpoints)
// ==========================================================

float calculateAQI_PM10(float pm10)
{
    if (pm10 <= 50)
        return (50.0 / 50.0) * pm10;

    else if (pm10 <= 100)
        return ((100 - 51.0) / (100 - 51.0)) * (pm10 - 51) + 51;

    else if (pm10 <= 250)
        return ((200 - 101.0) / (250 - 101.0)) * (pm10 - 101) + 101;

    else if (pm10 <= 350)
        return ((300 - 201.0) / (350 - 251.0)) * (pm10 - 251) + 201;

    else if (pm10 <= 430)
        return ((400 - 301.0) / (430 - 351.0)) * (pm10 - 351) + 301;

    else
        return 500;
}

// ==========================================================
// TIME
// ==========================================================

unsigned long getTime()
{
    time_t now;
    time(&now);
    return now;
}

// ==========================================================
// SETUP
// ==========================================================

void setup()
{
    Serial.begin(115200);
    delay(1000);

    // ---------------- Watchdog FIRST ----------------
    esp_task_wdt_init(15, true);
    esp_task_wdt_add(NULL);

    // ---------------- OLED ----------------
    Wire.begin(SDA_PIN, SCL_PIN);

    display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);

    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Booting AQI System...");
    display.display();

    // ---------------- WiFi ----------------
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    display.println("Connecting WiFi...");
    display.display();

    unsigned long wifiStart = millis();

    while (WiFi.status() != WL_CONNECTED)
    {
        esp_task_wdt_reset();
        delay(500);

        if (millis() - wifiStart > 20000)
        {
            display.println("WiFi Failed");
            display.display();
            delay(2000);
            ESP.restart();
        }
    }

    display.println("WiFi Connected");
    display.display();

    // ---------------- Time Sync ----------------
    configTime(0, 0, "pool.ntp.org");

    display.println("Syncing Time...");
    display.display();

    time_t now = time(nullptr);
    unsigned long ntpStart = millis();

    while (now < 100000 && millis() - ntpStart < 10000)
    {
        esp_task_wdt_reset();
        delay(500);
        now = time(nullptr);
    }

    if (now > 100000)
        display.println("Time OK");
    else
        display.println("NTP Timeout");

    display.display();

    // -------- Align rolling windows AFTER wait --------
    if (now > 100000)
    {
        lastMinuteEpoch    = now - (now % 60);
        lastTenMinuteEpoch = now - (now % 600);
    }
    else
    {
        unsigned long fallback = millis() / 1000;

        lastMinuteEpoch    = fallback - (fallback % 60);
        lastTenMinuteEpoch = fallback - (fallback % 600);
    }

    // ---------------- Firebase ----------------
    config.api_key               = API_KEY;
    config.database_url          = DATABASE_URL;
    config.token_status_callback = tokenStatusCallback;

    auth.user.email    = "<YOUR_AUTHORIZED_USER_EMAIL>";
    auth.user.password = "<YOUR_AUTHORIZED_USER_PASSWORD>";

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    display.println("Firebase Ready");
    display.display();

    // ---------------- Sensors ----------------
    bmp_ok = bmp.begin(0x76);

    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);

    pmsSerial.begin(9600, SERIAL_8N1, PMS_RX, PMS_TX);
    lastPmsUpdate = millis();

    display.println("Sensors Ready");
    display.display();

    delay(1500);

    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("System Ready");
    display.display();

    delay(1000);
}

// ==========================================================
// LOOP
// ==========================================================

void loop()
{
    esp_task_wdt_reset();

    if (WiFi.status() != WL_CONNECTED)
        WiFi.reconnect();

    time_t now = time(nullptr);

    // If NTP not valid, fallback to millis-based time
    if (now < 1700000000)
        now = millis() / 1000;

    // ---------------- Read BMP ----------------
    float temperature = 0;
    float pressure    = 0;

    if (bmp_ok)
    {
        temperature = bmp.readTemperature();
        pressure    = bmp.readPressure() / 100.0;
    }

    // ---------------- Read MQ7 ----------------
    int raw = analogRead(MQ7_PIN);
    float mq_voltage = raw * (3.3 / 4095.0);

    // ---------------- Read PMS ----------------
    while (pmsSerial.available() >= 32)
    {
        if (pmsSerial.read() == 0x42)
        {
            if (pmsSerial.read() == 0x4D)
            {
                uint8_t frame[30];
                pmsSerial.readBytes(frame, 30);

                uint16_t sum = 0x42 + 0x4D;

                for (int i = 0; i < 28; i++)
                    sum += frame[i];

                uint16_t receivedChecksum = (frame[28] << 8) | frame[29];

                if (sum == receivedChecksum)
                {
                    pm1_value  = (frame[8]  << 8) | frame[9];
                    pm25_value = (frame[10] << 8) | frame[11];
                    pm10_value = (frame[12] << 8) | frame[13];

                    lastPmsUpdate = millis();
                }

                break;
            }
        }
    }

    if (millis() - lastPmsUpdate > 15000)
        Serial.println("⚠ PMS not responding");

    float aqi = max(
        calculateAQI_PM25(pm25_value),
        calculateAQI_PM10(pm10_value)
    );

    // ---------------- CO Status ----------------
    const char* coStatus;

    if (mq_voltage < 0.08)
        coStatus = "SAFE";
    else if (mq_voltage < 0.15)
        coStatus = "ELEVATED";
    else
        coStatus = "HIGH";

    // =========================================================
    // ALERT SYSTEM
    // =========================================================

    // ---- AQI Severe Alert ----
    if (aqi > 300 && !aqiAlertActive)
    {
        FirebaseJson alert;
        alert.set("type", "AQI_SEVERE");
        alert.set("value", aqi);
        alert.set("timestamp", now);

        String alertPath = "/devices/device01/alerts/" + String(now);
        Firebase.RTDB.setJSON(&fbdo, alertPath.c_str(), &alert);

        String oldAlert = "/devices/device01/alerts/" + String(now - 604800);
        Firebase.RTDB.deleteNode(&fbdo, oldAlert.c_str());

        aqiAlertActive = true;
    }

    // Reset when AQI improves
    if (aqi < 250)
        aqiAlertActive = false;

    // ---- CO HIGH Alert ----
    if (strcmp(coStatus, "HIGH") == 0 && !coAlertActive)
    {
        FirebaseJson alert;
        alert.set("type", "CO_HIGH");
        alert.set("timestamp", now);

        String alertPath = "/devices/device01/alerts/" + String(now);
        Firebase.RTDB.setJSON(&fbdo, alertPath.c_str(), &alert);

        String oldAlert = "/devices/device01/alerts/" + String(now - 604800);
        Firebase.RTDB.deleteNode(&fbdo, oldAlert.c_str());

        coAlertActive = true;
    }

    // Reset when safe
    if (strcmp(coStatus, "SAFE") == 0)
        coAlertActive = false;

    // =========================================================
    // OLED DISPLAY (LIVE VALUES)
    // =========================================================

    display.clearDisplay();

    display.setTextSize(2);
    display.setCursor(15, 0);
    display.print("AQI ");
    display.print((int)aqi);

    display.setTextSize(1);

    display.setCursor(0, 22);
    display.print("PM1:");
    display.print(pm1_value);

    display.setCursor(62, 22);
    display.print("PM2.5:");
    display.print(pm25_value);

    display.setCursor(0, 32);
    display.print("PM10: ");
    display.print(pm10_value);

    display.setCursor(0, 44);
    display.print("Temp: ");
    display.print(temperature, 1);
    display.print("C");

    display.setCursor(0, 54);
    display.print("P: ");
    display.print(pressure, 0);
    display.print("hPa");

    display.setCursor(80, 54);
    display.print("CO: ");
    display.print(coStatus);

    display.display();

    // =========================================================
    // 10 SECOND UPLOAD + ROLLING AGGREGATION
    // =========================================================

    if (Firebase.ready() &&
        (millis() - sendDataPrevMillis > 10000 || sendDataPrevMillis == 0))
    {
        sendDataPrevMillis = millis();

        FirebaseJson json;
        json.set("aqi", aqi);
        json.set("pm1", pm1_value);
        json.set("pm25", pm25_value);
        json.set("pm10", pm10_value);
        json.set("temp", temperature);
        json.set("pressure", pressure);
        json.set("co_status", coStatus);
        json.set("timestamp", now);

        Firebase.RTDB.setJSON(&fbdo, "/devices/device01/live", &json);

        String rawPath = "/devices/device01/raw_10s/" + String(now);
        Firebase.RTDB.setJSON(&fbdo, rawPath.c_str(), &json);

        String oldRawPath = "/devices/device01/raw_10s/" + String(now - 3600);
        Firebase.RTDB.deleteNode(&fbdo, oldRawPath.c_str());

        // ---- Aggregate ----
        min1 = min(min1, aqi);
        max1 = max(max1, aqi);
        sum1 += aqi;
        count1++;

        min10 = min(min10, aqi);
        max10 = max(max10, aqi);
        sum10 += aqi;
        count10++;
    }

    // =========================================================
    // 1-MINUTE BUCKET
    // =========================================================

    if (now - lastMinuteEpoch >= 60 && count1 > 0)
    {
        FirebaseJson bucket1;
        bucket1.set("min", min1);
        bucket1.set("max", max1);
        bucket1.set("avg", sum1 / count1);
        bucket1.set("count", count1);

        String path1 = "/devices/device01/bucket_1min/" + String(lastMinuteEpoch);
        Firebase.RTDB.setJSON(&fbdo, path1.c_str(), &bucket1);

        String old1MinPath = "/devices/device01/bucket_1min/" + String(now - 86400);
        Firebase.RTDB.deleteNode(&fbdo, old1MinPath.c_str());

        min1 = 9999;
        max1 = 0;
        sum1 = 0;
        count1 = 0;

        lastMinuteEpoch = now - (now % 60);
    }

    // =========================================================
    // 10-MINUTE BUCKET
    // =========================================================

    if (now - lastTenMinuteEpoch >= 600 && count10 > 0)
    {
        FirebaseJson bucket10;
        bucket10.set("min", min10);
        bucket10.set("max", max10);
        bucket10.set("avg", sum10 / count10);
        bucket10.set("count", count10);

        String path10 = "/devices/device01/bucket_10min/" + String(lastTenMinuteEpoch);
        Firebase.RTDB.setJSON(&fbdo, path10.c_str(), &bucket10);

        String old10MinPath = "/devices/device01/bucket_10min/" + String(now - 604800);
        Firebase.RTDB.deleteNode(&fbdo, old10MinPath.c_str());

        min10 = 9999;
        max10 = 0;
        sum10 = 0;
        count10 = 0;

        lastTenMinuteEpoch = now - (now % 600);
    }

    // =========================================================
    // DEBUG OUTPUT IN SERIAL MONITOR
    // =========================================================

    Serial.println("------");
    Serial.print("Temp: ");
    Serial.println(temperature);

    Serial.print("Pressure: ");
    Serial.println(pressure);

    Serial.print("PM2.5: ");
    Serial.println(pm25_value);

    Serial.print("PM10: ");
    Serial.println(pm10_value);

    Serial.print("PM1: ");
    Serial.println(pm1_value);

    Serial.print("AQI: ");
    Serial.println(aqi);

    Serial.print("CO Voltage: ");
    Serial.println(mq_voltage);

    delay(2000);
}