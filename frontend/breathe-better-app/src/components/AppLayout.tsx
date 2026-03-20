import { ReactNode } from "react";
import { motion } from "framer-motion";
import BottomNav from "./BottomNav";

const AppLayout = ({ children, ambientColor = "var(--primary)" }: { children: ReactNode, ambientColor?: string }) => {
  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-x-hidden">
      {/* Dynamic Breathing Ambient Background */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] pointer-events-none opacity-20 z-0 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${ambientColor} 0%, transparent 60%)`,
        }}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay z-0" />
      
      <div className="max-w-lg mx-auto relative z-10">{children}</div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
