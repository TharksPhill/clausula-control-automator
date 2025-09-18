
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  variant?: "default" | "outline" | "ghost";
}

const BackButton = ({ onClick, label = "Voltar", variant = "outline" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Sempre volta para a tela anterior no histórico
      navigate(-1);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleClick}
      className="flex items-center gap-2 mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
};

export default BackButton;
