import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Apple, Leaf, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const tabs = ["Recommendations", "Food Log", "Correlation"];

const recommendations = [
  { name: "Turmeric (Haldi)", desc: "Anti-inflammatory, reduces airway inflammation", category: "Anti-inflammatory", icon: "🧡" },
  { name: "Yogurt / Dahi", desc: "Rich in probiotics for gut-lung axis", category: "Probiotics", icon: "🥛" },
  { name: "Ginger Tea", desc: "Bronchodilator properties, eases breathing", category: "Anti-inflammatory", icon: "🍵" },
  { name: "Flaxseeds", desc: "Omega-3 fatty acids reduce inflammation", category: "Anti-inflammatory", icon: "🌰" },
  { name: "Kimchi", desc: "Fermented food for gut microbiome", category: "Probiotics", icon: "🥬" },
  { name: "Avoid: Dairy excess", desc: "Can increase mucus in some patients", category: "Foods to Avoid", icon: "⚠️" },
  { name: "Avoid: Fried foods", desc: "Triggers inflammation and wheezing", category: "Foods to Avoid", icon: "⚠️" },
];

const correlationData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  lungScore: 65 + Math.round(Math.random() * 20),
  gutCompliance: 50 + Math.round(Math.random() * 40),
}));

const categoryIcons = {
  "Anti-inflammatory": <Leaf className="w-4 h-4 text-success" />,
  "Probiotics": <Apple className="w-4 h-4 text-primary" />,
  "Foods to Avoid": <AlertTriangle className="w-4 h-4 text-warning" />,
};

const GutHealth = () => {
  const [activeTab, setActiveTab] = useState("Recommendations");
  const [foodLog, setFoodLog] = useState([
    { id: 1, name: "Turmeric milk", category: "Anti-inflammatory", time: "8:30 AM" },
    { id: 2, name: "Yogurt bowl", category: "Probiotics", time: "1:00 PM" },
    { id: 3, name: "Green salad", category: "Anti-inflammatory", time: "7:30 PM" },
  ]);
  const [newFood, setNewFood] = useState("");

  const addFood = () => {
    if (!newFood.trim()) return;
    setFoodLog([
      ...foodLog,
      { id: Date.now(), name: newFood, category: "Anti-inflammatory", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setNewFood("");
    toast.success("Food logged!");
  };

  const removeFood = (id: number) => {
    setFoodLog(foodLog.filter((f) => f.id !== id));
    toast("Food removed");
  };

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-display font-bold">Gut Health</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {activeTab === "Recommendations" && (
          <div className="space-y-3">
            {["Anti-inflammatory", "Probiotics", "Foods to Avoid"].map((cat) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  {categoryIcons[cat as keyof typeof categoryIcons]}
                  <h3 className="text-sm font-semibold">{cat}</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {recommendations.filter((r) => r.category === cat).map((r) => (
                    <div key={r.name} className="flex items-start gap-3 bg-card border border-border/50 rounded-xl px-4 py-3">
                      <span className="text-xl">{r.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Food Log" && (
          <div>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="What did you eat?"
                value={newFood}
                onChange={(e) => setNewFood(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFood()}
              />
              <Button onClick={addFood} size="icon" className="gradient-primary text-primary-foreground shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {foodLog.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-card border border-border/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.time} • {f.category}</p>
                  </div>
                  <button onClick={() => removeFood(f.id)} className="text-muted-foreground hover:text-destructive transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {foodLog.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Apple className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No foods logged today</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Correlation" && (
          <div className="stat-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Lung Score vs Gut Compliance</h3>
            <p className="text-xs text-muted-foreground mb-4">Last 30 days</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="lungScore" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} name="Lung Score" />
                <Line type="monotone" dataKey="gutCompliance" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} name="Gut Compliance" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded bg-primary" />
                <span className="text-xs text-muted-foreground">Lung Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded bg-success" />
                <span className="text-xs text-muted-foreground">Gut Compliance</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GutHealth;
