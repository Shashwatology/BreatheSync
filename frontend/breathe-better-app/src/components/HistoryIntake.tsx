import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarClock, Save, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const HISTORY_TRIGGERS = ["Dust", "Pollen", "Cold Air", "Exercise", "Stress", "Pet Dander", "Smoke"];
const SEVERITY_STAGES = ["Intermittent", "Mild Persistent", "Moderate Persistent", "Severe Persistent"];

export default function HistoryIntake() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [peakFlow, setPeakFlow] = useState<string>("");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string>("Intermittent");

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
        // We append the new triggers to the profile to keep a rolling array of triggers
        // In a real HIPAA app, this would be a separate 'daily_logs' table,
        // but for this phase we update the profile schema we migrated earlier.
        
        let updatedTriggers = selectedTriggers;
        if(profile && (profile as any).daily_triggers) {
            // merge and deduplicate
            updatedTriggers = Array.from(new Set([...(profile as any).daily_triggers, ...selectedTriggers]));
        }

        const { error } = await supabase
            .from("profiles")
            .update({
                peak_flow_baseline: peakFlow ? parseInt(peakFlow) : null,
                severity_stage: severity,
                daily_triggers: updatedTriggers
            })
            .eq("user_id", user.id);

        if (error) throw error;
        
        toast.success("Daily history logged successfully! 💙");
        setOpen(false);
        // Reset form
        setPeakFlow("");
        setSelectedTriggers([]);
    } catch (e: any) {
        toast.error("Failed to save log: " + e.message);
    } finally {
        setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="glass-card hover-lift press-effect flex items-center justify-between !p-4 group mt-4 w-full border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                 <CalendarClock className="w-5 h-5 text-primary" />
             </div>
             <div className="text-left">
                 <p className="text-sm font-semibold text-foreground">Daily History Log</p>
                 <p className="text-[11px] text-muted-foreground">Track triggers & peak flow</p>
             </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-background border-border shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">Log Your Day</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Tracking symptoms helps predict future flair-ups.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 pt-4">
            
            {/* Peak Flow */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Peak Flow (L/min)
                </label>
                <input 
                    type="number"
                    placeholder="e.g. 450"
                    value={peakFlow}
                    onChange={(e) => setPeakFlow(e.target.value)}
                    className="w-full glass-input text-sm p-3 rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all"
                />
            </div>

            {/* Triggers */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> What triggered you today?
                </label>
                <div className="flex flex-wrap gap-2">
                    {HISTORY_TRIGGERS.map((t) => (
                        <button
                            key={t}
                            onClick={() => toggleTrigger(t)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all press-effect border ${
                                selectedTriggers.includes(t)
                                    ? "bg-destructive text-destructive-foreground border-destructive"
                                    : "bg-muted text-muted-foreground border-transparent hover:border-border"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* GINA Severity */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> GINA Asthma Stage
                </label>
                <select 
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full glass-input text-sm p-3 rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer appearance-none bg-background text-foreground"
                >
                    {SEVERITY_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                    ))}
                </select>
                <p className="text-[10px] text-muted-foreground">Used by your doctor to adjust medications.</p>
            </div>
            
            <Button 
                onClick={handleSave}
                disabled={saving}
                className="w-full gradient-primary rounded-xl h-12 shadow-glow text-primary-foreground font-semibold flex items-center gap-2 press-effect hover:brightness-110"
            >
                {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Daily Log</>}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
