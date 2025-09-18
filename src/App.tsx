import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";

import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import EnhancedCompanyCosts from "@/components/EnhancedCompanyCosts";
import TaxManagementPage from "@/pages/TaxManagement";
import FinancialAnalysisPage from "@/pages/FinancialAnalysis";
import ProfitAnalysisPage from "@/pages/ProfitAnalysis";
import ContractSignaturesPage from "@/pages/ContractSignatures";
import ContractAdjustmentsPage from "@/pages/ContractAdjustments";
import TechnicalVisitCalculatorPage from "@/pages/TechnicalVisitCalculator";
import MarketSegmentation from "@/pages/MarketSegmentation";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/company-costs"
            element={
              <RequireAuth>
                <EnhancedCompanyCosts />
              </RequireAuth>
            }
          />
          <Route path="/tax-management" element={<TaxManagementPage />} />
          <Route
            path="/financial-analysis"
            element={
              <RequireAuth>
                <FinancialAnalysisPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profit-analysis"
            element={
              <RequireAuth>
                <ProfitAnalysisPage />
              </RequireAuth>
            }
          />
          <Route
            path="/contract-signatures"
            element={
              <RequireAuth>
                <ContractSignaturesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/contract-adjustments"
            element={
              <RequireAuth>
                <ContractAdjustmentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/technical-visit-calculator"
            element={
              <RequireAuth>
                <TechnicalVisitCalculatorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/market-segmentation"
            element={
              <RequireAuth>
                <MarketSegmentation />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

export default App;
