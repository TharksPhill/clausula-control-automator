
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-6">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-2xl text-blue-900">Política de Privacidade</CardTitle>
            <p className="text-sm text-gray-600 mt-2">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Informações que Coletamos</h2>
              <p className="text-gray-600 leading-relaxed">
                Nosso Sistema Profissional de Gestão de Contratos coleta informações necessárias para o funcionamento adequado da plataforma, incluindo:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Dados de identificação da empresa (razão social, CNPJ, endereço)</li>
                <li>Informações de contato (e-mail, telefone)</li>
                <li>Dados dos contratos e contratantes</li>
                <li>Informações de navegação e uso da plataforma</li>
                <li>Dados de assinatura digital quando aplicável</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Como Utilizamos suas Informações</h2>
              <p className="text-gray-600 leading-relaxed">
                As informações coletadas são utilizadas para:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Gerar e gerenciar contratos de forma automatizada</li>
                <li>Facilitar o processo de assinatura digital</li>
                <li>Enviar notificações importantes sobre contratos</li>
                <li>Gerar relatórios e estatísticas de uso</li>
                <li>Melhorar nossos serviços e funcionalidades</li>
                <li>Cumprir obrigações legais e regulamentares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Proteção dos Dados</h2>
              <p className="text-gray-600 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia SSL/TLS para transmissão de dados e armazenamento seguro em servidores protegidos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Compartilhamento de Informações</h2>
              <p className="text-gray-600 leading-relaxed">
                Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, exceto quando:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Necessário para cumprimento de obrigações legais</li>
                <li>Com sua expressa autorização</li>
                <li>Para prestadores de serviços essenciais (como DocuSign para assinaturas)</li>
                <li>Em caso de transferência de propriedade da empresa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Seus Direitos (LGPD)</h2>
              <p className="text-gray-600 leading-relaxed">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Confirmação da existência de tratamento de dados</li>
                <li>Acesso aos dados pessoais</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados</li>
                <li>Eliminação dos dados tratados com consentimento</li>
                <li>Revogação do consentimento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">
                Utilizamos cookies para melhorar sua experiência de navegação, manter suas preferências e analisar o uso da plataforma. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Retenção de Dados</h2>
              <p className="text-gray-600 leading-relaxed">
                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política ou conforme exigido por lei. Dados de contratos podem ser mantidos por períodos específicos para fins legais e contratuais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Alterações nesta Política</h2>
              <p className="text-gray-600 leading-relaxed">
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através da plataforma ou por e-mail. Recomendamos revisar esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Contato</h2>
              <p className="text-gray-600 leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato através dos canais disponíveis na plataforma ou pelo e-mail de suporte.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
