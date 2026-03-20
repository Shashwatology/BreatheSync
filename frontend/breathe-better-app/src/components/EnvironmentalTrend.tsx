import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { motion } from "framer-motion";

interface EnvironmentalTrendProps {
  data: number[];
  color: string;
}

export default function EnvironmentalTrend({ data, color }: EnvironmentalTrendProps) {
  // Format data for Recharts
  const chartData = data.map((value, i) => ({ value, index: i }));
  
  // Find min/max for dynamic Y-axis scaling to make the sparkline look pronounced
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = (max - min) * 0.2 || 10;

  return (
    <div className="h-10 w-full mt-2 opacity-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis 
            domain={[min - padding, max + padding]} 
            hide 
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
