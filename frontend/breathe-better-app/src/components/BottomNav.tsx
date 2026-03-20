import { Home, Wind, Map, Apple, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Wind, label: "Lung Gym", path: "/lung-gym" },
  { icon: Map, label: "Map", path: "/trigger-map" },
  { icon: Apple, label: "Gut Health", path: "/gut-health" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-auto max-w-lg px-4 pb-2">
        <div
          className="flex items-center justify-around px-2 py-2.5 rounded-2xl border border-white/10"
          style={{
            background: "rgba(11, 18, 32, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`bottom-nav-item px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "active bg-primary/15" : ""
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(217,91%,60%)]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
