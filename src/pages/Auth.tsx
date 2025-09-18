
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, UserPlus, ShieldCheck, TrendingUp, Clock, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const redirectPath = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (user) {
      console.log("Usuário autenticado, redirecionando para:", redirectPath);
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3');
    }
    return numbers.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    console.log("Tentando autenticação:", { isLogin, email });

    // Validação adicional para signup
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        setLoading(false);
        return;
      }
      
      if (!name || !tradeName || !cnpj || !phone) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        setLoading(false);
        return;
      }
      
      const cnpjNumbers = cnpj.replace(/\D/g, '');
      if (cnpjNumbers.length !== 14) {
        setError("CNPJ inválido. Deve conter 14 dígitos.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        console.log("Fazendo login...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          console.error("Erro no login:", error);
          throw error;
        }
        
        console.log("Login bem-sucedido:", data);
      } else {
        console.log("Criando conta...");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectPath}`,
            data: {
              name,
              trade_name: tradeName,
              cnpj: cnpj.replace(/\D/g, ''),
              phone: phone.replace(/\D/g, ''),
              website
            }
          },
        });
        
        if (error) {
          console.error("Erro no cadastro:", error);
          throw error;
        }
        
        console.log("Cadastro realizado:", data);
        
        if (data.user && !data.session) {
          setSuccess("Verifique seu email para confirmar a conta antes de fazer login!");
          setIsLogin(true);
          return;
        }
        
        if (data.session) {
          console.log("Usuário logado automaticamente após cadastro");
          setSuccess("Conta criada com sucesso!");
        }
      }
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      
      let errorMessage = error.message;
      
      // Tratar erros específicos
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message?.includes("Unable to validate email address")) {
        errorMessage = "Email inválido. Verifique o formato do email.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Email não confirmado. Verifique sua caixa de entrada.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log("Tentando login com Google...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });
      if (error) {
        console.error("Erro no login com Google:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Erro no Google Auth:", error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* Logo */}
        <div className="mb-12">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Sistema de Gestão</h1>
          <p className="text-white/80 mt-2">Plataforma Completa de Contratos</p>
        </div>
          
          {/* Features */}
          <div className="space-y-6 max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gestão Simplificada</h3>
                <p className="text-white/70 text-sm">Gerencie todos os seus contratos em um único lugar de forma intuitiva e eficiente.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Segurança Garantida</h3>
                <p className="text-white/70 text-sm">Seus dados protegidos com criptografia de ponta a ponta e conformidade total.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Acesso 24/7</h3>
                <p className="text-white/70 text-sm">Acesse seus contratos e documentos a qualquer hora, de qualquer lugar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Home
          </Button>
          
          {/* Form Container */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {isLogin ? "Bem-vindo de volta" : "Criar nova conta"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin 
                  ? "Entre com suas credenciais para acessar sua conta" 
                  : "Preencha os dados abaixo para criar sua conta"}
              </p>
              {searchParams.get('redirect') && (
                <p className="text-sm text-primary mt-2">
                  Faça login para visualizar o contrato
                </p>
              )}
            </div>
            
            {/* Alerts */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos de Login */}
              {isLogin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                </>
              ) : (
                /* Campos de Criação de Conta */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Responsável *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tradeName">Nome Fantasia *</Label>
                    <Input
                      id="tradeName"
                      type="text"
                      placeholder="Nome da empresa"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                        required
                        maxLength={18}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        required
                        maxLength={15}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Site (opcional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.exemplo.com.br"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    * Campos obrigatórios
                  </p>
                </div>
              )}
              
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  "Carregando..."
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>
            
            {/* Google Auth */}
            <Button
              variant="outline"
              onClick={handleGoogleAuth}
              className="w-full"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            
            {/* Toggle between login and signup */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
              </span>
              <Button
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="p-0 h-auto font-semibold"
                disabled={loading}
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
