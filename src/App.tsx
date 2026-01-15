import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import CoverPage from "./pages/CoverPage";
import TaskOverview from "./pages/TaskOverview";
import PromotionalWorkflow from "./pages/PromotionalWorkflow";
import PTOGallery from "./pages/PTOGallery";
import PipQA from "./pages/PipQA";
import AllenQA from "./pages/AllenQA";
import NotFound from "./pages/NotFound";
import Crawling from "./pages/Crawling";
import MaplePDP from "./pages/MaplePDP";
import ZoeLifestyle from "./pages/ZoeLifestyle";
import ZoeCamera from "./pages/ZoeCamera";
import MiloECRM from "./pages/MiloECRM";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/promotional" element={<PromotionalWorkflow />} />
        <Route path="/pto-gallery" element={<PTOGallery />} />
        <Route path="/tasks" element={<TaskOverview />} />
        <Route path="/pip-qa" element={<PipQA />} />
        <Route path="/allen-qa" element={<AllenQA />} />
        <Route path="/crawling" element={<Crawling />} />
        <Route path="/maple-pdp" element={<MaplePDP />} />
        <Route path="/zoe-lifestyle" element={<ZoeLifestyle />} />
        <Route path="/zoe-camera/:sessionId" element={<ZoeCamera />} />
        <Route path="/milo-ecrm" element={<MiloECRM />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
