import { useEffect, useState } from "react";
import { app } from "../firebase";
import { getDatabase, ref, onValue } from "firebase/database";

const db = getDatabase(app);

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const alertsRef = ref(db, "devices/device01/alerts");

    const unsubscribe = onValue(alertsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setAlerts([]);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - 604800;

      const raw = snapshot.val();

      const formatted = Object.keys(raw)
        .map((key) => ({
          timestamp: Number(key),
          ...raw[key],
        }))
        .filter((alert) => alert.timestamp >= sevenDaysAgo)
        .sort((a, b) => b.timestamp - a.timestamp); // newest first

      setAlerts(formatted);
    });

    return () => unsubscribe();
  }, []);

  const getColor = (type) => {
    if (type === "AQI_SEVERE") return "bg-red-600";
    if (type === "CO_HIGH") return "bg-orange-500";
    return "bg-gray-500";
  };

  const formatTimeAgo = (epoch) => {
    const diff = Math.floor(Date.now() / 1000) - epoch;

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="p-8 text-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6 border-b border-slate-700 pb-3">
          Alert History
        </h1>

        {alerts.length === 0 && (
          <p className="text-gray-400">No alerts in last 7 days.</p>
        )}

        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.timestamp}
              className="flex justify-between items-center bg-slate-800 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${getColor(alert.type)}`}
                ></div>

                <div>
                  <p className="font-semibold">{alert.type}</p>

                  {alert.value && (
                    <p className="text-sm text-gray-400">
                      Value: {alert.value}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    {new Date(alert.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                {formatTimeAgo(alert.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}