import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronRight } from "lucide-react";

const tips = [
  { emoji: "🫁", text: "Deep breathing for 5 min daily can improve lung capacity by 15%" },
  { emoji: "🧘", text: "Morning pranayama reduces asthma flare-ups by up to 40%" },
  { emoji: "💧", text: "Stay hydrated — it keeps your airways moist and reduces irritation" },
  { emoji: "🥦", text: "Anti-inflammatory foods like turmeric & ginger support lung health" },
  { emoji: "🌿", text: "Indoor plants like spider plant & aloe vera purify air naturally" },
  { emoji: "😴", text: "Quality sleep helps your lungs repair and regenerate overnight" },
];

const HealthTipCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % tips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card !p-4 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-accent/10">
          <Lightbulb className="w-3.5 h-3.5 text-accent" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Health Tip</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3"
        >
          <span className="text-2xl shrink-0 mt-0.5">{tips[index].emoji}</span>
          <p className="text-sm text-foreground/80 leading-relaxed">{tips[index].text}</p>
        </motion.div>
      </AnimatePresence>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {tips.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-accent" : "w-1.5 bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HealthTipCarousel;
