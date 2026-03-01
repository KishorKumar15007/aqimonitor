import { NavLink } from "react-router-dom";
import { useState } from "react";

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      
      {/* Sidebar */}
      <div className={`bg-slate-900 transition-all duration-300 ${open ? "w-64" : "w-20"} hidden md:flex flex-col`}>

        <div className="p-6 font-bold text-lg border-b border-slate-800">
          {open ? "AQI Monitor" : "AQI"}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/" label="Dashboard" open={open} />
          <NavItem to="/analytics" label="Analytics" open={open} />
          <NavItem to="/devices" label="Devices" open={open} />
          <NavItem to="/alerts" label="Alerts" open={open} />
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="p-4 border-t border-slate-800 hover:bg-slate-800 transition"
        >
          {open ? "Collapse" : ">"}
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900">
          <div className="font-semibold text-lg">Smart Air Monitoring</div>
          <div className="text-sm text-slate-400">
            Real-time System
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8 flex-1 bg-gradient-to-br from-slate-950 to-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, label, open }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-3 rounded-xl transition ${
          isActive
            ? "bg-green-500 text-black"
            : "hover:bg-slate-800 text-slate-300"
        }`
      }
    >
      {open ? label : label.charAt(0)}
    </NavLink>
  );
}