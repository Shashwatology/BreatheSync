import { LucideIcon } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
  children?: React.ReactNode;
}

const iconStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

const StatCard = ({ icon: Icon, title, value, subtitle, variant = "default", children }: StatCardProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    // Calculate values from -1 to 1 based on mouse position relative to center
    const tiltX = (y / height - 0.5) * -10;
    const tiltY = (x / width - 0.5) * 10;
    
    mouseX.set(tiltY);
    mouseY.set(tiltX);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      className="glass-card relative overflow-hidden group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: mouseY,
        rotateY: mouseX,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Animated glow that follows the mouse (simplified for performance) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
           
      <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-xl ${iconStyles[variant]}`}>
            <Icon className="w-5 h-5 drop-shadow-md" />
          </div>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-2xl font-bold font-display tracking-tight text-white/95">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {children}
      </div>
    </motion.div>
  );
};

export default StatCard;
