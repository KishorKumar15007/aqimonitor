import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const liveRef = ref(db, "devices/device01/live");

    const unsubscribe = onValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="AQI" value={data.aqi} highlight />
        <StatCard title="PM2.5" value={data.pm25} />
        <StatCard title="Temperature (°C)" value={data.temp} />
        <StatCard title="CO Status" value={data.co_status} />
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }) {

  const getAqiColor = (aqi) => {
    if (aqi <= 50) return "text-green-400";
    if (aqi <= 100) return "text-yellow-400";
    if (aqi <= 200) return "text-orange-400";
    if (aqi <= 300) return "text-red-500";
    return "text-purple-500";
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300">
      <div className="text-slate-400 text-sm">{title}</div>
      <div
        className={`text-4xl font-bold mt-2 ${
          highlight ? getAqiColor(value) : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}