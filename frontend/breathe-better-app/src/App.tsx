import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initPushNotifications } from "@/lib/pushNotifications";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import VoiceCheck from "./pages/VoiceCheck";
import LungGym from "./pages/LungGym";
import TriggerMap from "./pages/TriggerMap";
import GutHealth from "./pages/GutHealth";
import Profile from "./pages/Profile";
import NotificationSettings from "./pages/NotificationSettings";
import NotFound from "./pages/NotFound";
import SleepMode from "./pages/SleepMode";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initPushNotifications();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/voice-check" element={<VoiceCheck />} />
          <Route path="/lung-gym" element={<LungGym />} />
          <Route path="/trigger-map" element={<TriggerMap />} />
          <Route path="/gut-health" element={<GutHealth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sleep-mode" element={<SleepMode />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
