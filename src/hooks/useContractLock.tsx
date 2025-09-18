
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useContractLock = (contractId?: string) => {
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkContractLock = async () => {
      if (!contractId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("status")
          .eq("id", contractId)
          .single();

        if (error) {
          console.error("Error checking contract lock:", error);
          setIsLocked(false);
        } else {
          // Contrato está travado se o status for "Revisado"
          setIsLocked(data.status === "Revisado");
        }
      } catch (error) {
        console.error("Error checking contract lock:", error);
        setIsLocked(false);
      } finally {
        setLoading(false);
      }
    };

    checkContractLock();
  }, [contractId]);

  return { isLocked, loading };
};
