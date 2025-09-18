
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background dark:bg-gray-900 text-foreground dark:text-gray-100 py-4 border-t border-border dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left text-sm text-muted-foreground dark:text-gray-400">
            &copy; {new Date().getFullYear()} Sistema Profissional de Gestão de Contratos - Todos os direitos reservados
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link 
              to="/privacy-policy" 
              className="text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-100 hover:underline transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-muted-foreground/50 dark:text-gray-500">|</span>
            <Link 
              to="/terms-of-service" 
              className="text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-100 hover:underline transition-colors"
            >
              Termos de Utilização
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
