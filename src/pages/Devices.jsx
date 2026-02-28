import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Devices() {
  const [data, setData] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const liveRef = ref(db, "devices/device01/live");

    const unsubscribe = onValue(liveRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const value = snapshot.val();
      setData(value);

      const now = Math.floor(Date.now() / 1000);
      const lastSeen = value.timestamp;

      setOnline(now - lastSeen < 30);
    });

    return () => unsubscribe();
  }, []);

  if (!data) return <div>Loading device...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Device Monitor</h1>

      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl">

        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold">Device: device01</div>
          <StatusBadge online={online} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

          <InfoCard label="AQI" value={data.aqi} />
          <InfoCard label="PM1" value={data.pm1} />
          <InfoCard label="PM2.5" value={data.pm25} />
          <InfoCard label="PM10" value={data.pm10} />
          <InfoCard label="Temperature" value={`${data.temp} °C`} />
          <InfoCard label="Pressure" value={`${data.pressure} hPa`} />
          <InfoCard label="CO Status" value={data.co_status} />
          <InfoCard
            label="Last Updated"
            value={new Date(data.timestamp * 1000).toLocaleString()}
          />

        </div>
      </div>
    </div>
  );
}

function StatusBadge({ online }) {
  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-semibold ${
        online ? "bg-green-500 text-black" : "bg-red-500 text-white"
      }`}
    >
      {online ? "ONLINE" : "OFFLINE"}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-900 p-5 rounded-xl shadow-md hover:scale-105 transition-all duration-300">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-lg font-semibold mt-2">{value}</div>
    </div>
  );
}