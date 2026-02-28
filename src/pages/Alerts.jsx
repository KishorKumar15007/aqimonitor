import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const alertRef = ref(db, "devices/device01/alerts");

    const unsubscribe = onValue(alertRef, (snapshot) => {
      if (!snapshot.exists()) {
        setAlerts([]);
        return;
      }

      const raw = snapshot.val();

      const sorted = Object.keys(raw)
        .map((k) => ({
          timestamp: parseInt(k),
          ...raw[k],
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      setAlerts(sorted);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Alerts</h1>

      {alerts.length === 0 && (
        <div className="bg-slate-800 p-6 rounded-xl">
          No alerts in last 7 days.
        </div>
      )}

      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <AlertCard key={index} alert={alert} />
        ))}
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  const getColor = (type) => {
    if (type === "AQI_SEVERE") return "border-red-500";
    if (type === "CO_HIGH") return "border-orange-500";
    return "border-yellow-500";
  };

  return (
    <div
      className={`bg-slate-800 p-6 rounded-xl border-l-4 ${getColor(
        alert.type
      )}`}
    >
      <div className="flex justify-between">
        <div className="font-semibold">{alert.type}</div>
        <div className="text-sm text-slate-400">
          {new Date(alert.timestamp * 1000).toLocaleString()}
        </div>
      </div>

      {alert.value && (
        <div className="mt-2 text-lg">
          Value: {alert.value}
        </div>
      )}
    </div>
  );
}