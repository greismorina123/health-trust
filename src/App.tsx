import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RoleProvider } from "@/context/RoleContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Search from "./pages/Search";
import FacilityPage from "./pages/FacilityPage";
import NgoDesertMap from "./pages/NgoDesertMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <RoleProvider>
        <TooltipProvider delayDuration={150}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/search" element={<Search />} />
              <Route path="/doctor" element={<DoctorReferral />} />
              <Route path="/ngo" element={<NgoDesertMap />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/facility/:id" element={<FacilityPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RoleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
