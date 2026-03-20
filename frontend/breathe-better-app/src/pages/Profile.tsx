import { ArrowLeft, User, Bell, Globe, Download, Sun, Moon, Monitor, LogOut, Save, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const languages = ["English", "Hindi", "Marathi", "Tamil", "Telugu"];

type ThemeMode = "light" | "dark" | "system";

const getInitialTheme = (): ThemeMode => {
  return (localStorage.getItem("theme") as ThemeMode) || "system";
};

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
};

interface ProfileData {
  full_name: string;
  phone: string;
  location: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_hospital: string;
}

const Field = ({ label, value, field, editing, onChange }: { label: string; value: string; field: keyof ProfileData; editing: boolean; onChange: (f: keyof ProfileData, v: string) => void }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    {editing ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full text-sm bg-muted rounded-lg px-3 py-2 border-none outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
      />
    ) : (
      <p className="text-sm">{value || <span className="text-muted-foreground italic">Not set</span>}</p>
    )}
  </div>
);

const Profile = () => {
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    phone: "",
    location: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    doctor_name: "",
    doctor_specialty: "",
    doctor_hospital: "",
  });

  const email = profile?.email || user?.email || "";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  // Fetch full profile data from DB
  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!user) return;

      // Handle Guest Mode (Demo)
      if (user.id === "guest-user-123") {
        setProfileData({
          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || "Shashwat",
          phone: "7311148888",
          location: "mumbai ,maharashtra",
          emergency_contact_name: "",
          emergency_contact_phone: "",
          doctor_name: "",
          doctor_specialty: "",
          doctor_hospital: "",
        });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, location, emergency_contact_name, emergency_contact_phone, doctor_name, doctor_specialty, doctor_hospital")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfileData({
          full_name: data.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "",
          phone: data.phone || "",
          location: data.location || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          doctor_name: data.doctor_name || "",
          doctor_specialty: data.doctor_specialty || "",
          doctor_hospital: data.doctor_hospital || "",
        });
      }
    };
    fetchFullProfile();
  }, [user, profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Handle Guest Mode save (Demo)
    if (user.id === "guest-user-123") {
      setTimeout(() => {
        setSaving(false);
        toast.success("Profile updated! (Demo Mode)");
        setEditing(false);
      }, 500);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileData.full_name,
        phone: profileData.phone,
        location: profileData.location,
        emergency_contact_name: profileData.emergency_contact_name,
        emergency_contact_phone: profileData.emergency_contact_phone,
        doctor_name: profileData.doctor_name,
        doctor_specialty: profileData.doctor_specialty,
        doctor_hospital: profileData.doctor_hospital,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated!");
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") applyTheme("system"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-display font-bold">Profile</h1>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {editing ? (
              <>{saving ? "Saving..." : <><Save className="w-3.5 h-3.5" /> Save</>}</>
            ) : (
              <><Pencil className="w-3.5 h-3.5" /> Edit</>
            )}
          </button>
        </div>

        {/* Avatar & Info */}
        <div className="stat-card text-center mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={profileData.full_name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-primary/20" />
          ) : (
            <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center mb-3">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
          )}
          {editing ? (
            <input
              type="text"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              className="text-center font-display font-bold text-lg bg-muted rounded-lg px-3 py-1 border-none outline-none focus:ring-2 focus:ring-primary/30 w-full max-w-[200px] mx-auto text-foreground"
            />
          ) : (
            <h2 className="font-display font-bold text-lg">{profileData.full_name || "Set your name"}</h2>
          )}
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="text-xs text-muted-foreground mt-1">{profileData.location || (editing ? "" : "Set your location")}</p>
        </div>

        {/* Personal Info */}
        <div className="stat-card mb-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Information
          </h3>
          <Field label="Phone" value={profileData.phone} field="phone" editing={editing} onChange={handleFieldChange} />
          <Field label="Location" value={profileData.location} field="location" editing={editing} onChange={handleFieldChange} />
        </div>

        {/* Emergency Contact */}
        <div className="stat-card mb-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="text-destructive">🚨</span> Emergency Contact
          </h3>
          <Field label="Contact Name" value={profileData.emergency_contact_name} field="emergency_contact_name" editing={editing} onChange={handleFieldChange} />
          <Field label="Contact Phone" value={profileData.emergency_contact_phone} field="emergency_contact_phone" editing={editing} onChange={handleFieldChange} />
        </div>

        {/* Doctor */}
        <div className="stat-card mb-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            🩺 Primary Doctor
          </h3>
          <Field label="Doctor Name" value={profileData.doctor_name} field="doctor_name" editing={editing} onChange={handleFieldChange} />
          <Field label="Specialty" value={profileData.doctor_specialty} field="doctor_specialty" editing={editing} onChange={handleFieldChange} />
          <Field label="Hospital" value={profileData.doctor_hospital} field="doctor_hospital" editing={editing} onChange={handleFieldChange} />
        </div>

        {/* ABHA Integration */}
        <div className="stat-card mb-4 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-indigo-100 dark:border-indigo-900/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-300 mb-2">
            🇮🇳 ABHA Interoperability
          </h3>
          <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mb-4 leading-relaxed">
            Link your Ayushman Bharat Health Account to seamlessly share your longitudinal lung health data with UHI-compliant hospitals.
          </p>
          
          {profileData.location === "linked-abha" ? (
            <div className="bg-white dark:bg-black/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20 text-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                <Globe className="w-6 h-6 text-success" />
              </div>
              <p className="font-semibold text-sm mb-1">ABHA Linked Successfully</p>
              <p className="text-xs text-muted-foreground font-mono mb-3">ID: 91-XXXX-XXXX-XX42</p>
              <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md">
                Generate Secure QR for Doctor
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                toast.success("OTP Sent to linked mobile number");
                // Simulate linking after a tiny delay for demo purposes
                setTimeout(() => setProfileData({...profileData, location: "linked-abha"}), 2000);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
            >
              Link ABHA ID
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>

        {/* Notifications — link to dedicated page */}
        <Link
          to="/notification-settings"
          className="stat-card mb-4 flex items-center justify-between !py-4 hover-lift"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Notification Settings</p>
              <p className="text-[11px] text-muted-foreground">Medication, breathing, AQI alerts</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
        </Link>

        {/* Appearance */}
        <div className="stat-card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold">Appearance</h3>
          </div>
          <div className="flex gap-2">
            {([
              { mode: "light" as ThemeMode, icon: Sun, label: "Light" },
              { mode: "dark" as ThemeMode, icon: Moon, label: "Dark" },
              { mode: "system" as ThemeMode, icon: Monitor, label: "System" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  theme === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="stat-card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Language</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  language === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <button className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition mb-3">
          <Download className="w-4 h-4" />
          Export My Data
        </button>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 border border-destructive/30 rounded-xl py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </AppLayout>
  );
};

export default Profile;
