
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
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
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="text-2xl text-green-900">Termos de Utilização</CardTitle>
            <p className="text-sm text-gray-600 mt-2">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Aceitação dos Termos</h2>
              <p className="text-gray-600 leading-relaxed">
                Ao acessar e utilizar o Sistema Profissional de Gestão de Contratos, você concorda em cumprir e estar vinculado a estes Termos de Utilização. Se você não concorda com qualquer parte destes termos, não deve utilizar nosso sistema.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Descrição do Serviço</h2>
              <p className="text-gray-600 leading-relaxed">
                Nossa plataforma oferece um sistema completo para gestão de contratos, incluindo:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Geração automatizada de contratos</li>
                <li>Gestão de múltiplos contratantes</li>
                <li>Sistema de assinatura digital</li>
                <li>Notificações e lembretes</li>
                <li>Relatórios e estatísticas</li>
                <li>Controle de períodos de teste</li>
                <li>Integração com DocuSign</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Cadastro e Conta de Usuário</h2>
              <p className="text-gray-600 leading-relaxed">
                Para utilizar nossos serviços, você deve:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a confidencialidade de suas credenciais</li>
                <li>Notificar imediatamente sobre uso não autorizado</li>
                <li>Ser responsável por todas as atividades em sua conta</li>
                <li>Ter capacidade legal para firmar contratos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Uso Adequado</h2>
              <p className="text-gray-600 leading-relaxed">
                Você concorda em utilizar o sistema apenas para fins legais e de acordo com estes termos. É proibido:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Violar leis aplicáveis ou regulamentações</li>
                <li>Interferir no funcionamento do sistema</li>
                <li>Tentar acessar áreas restritas</li>
                <li>Usar o sistema para atividades fraudulentas</li>
                <li>Compartilhar credenciais com terceiros</li>
                <li>Fazer engenharia reversa do software</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Propriedade Intelectual</h2>
              <p className="text-gray-600 leading-relaxed">
                Todo o conteúdo, funcionalidades e tecnologia do sistema são propriedade exclusiva nossa ou de nossos licenciadores. Você mantém a propriedade dos dados que inserir no sistema, concedendo-nos licença para processá-los conforme necessário para prestar os serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Planos e Pagamentos</h2>
              <p className="text-gray-600 leading-relaxed">
                O acesso a certas funcionalidades pode estar sujeito a planos pagos. Os termos específicos de pagamento, cancelamento e reembolso são definidos no momento da contratação e podem variar conforme o plano escolhido.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Disponibilidade e Manutenção</h2>
              <p className="text-gray-600 leading-relaxed">
                Embora nos esforcemos para manter o sistema disponível 24/7, pode haver interrupções para manutenção programada ou por motivos técnicos. Não garantimos disponibilidade ininterrupta e não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Limitação de Responsabilidade</h2>
              <p className="text-gray-600 leading-relaxed">
                Nossa responsabilidade é limitada ao valor pago pelos serviços nos últimos 12 meses. Não nos responsabilizamos por danos indiretos, lucros cessantes ou perdas de dados, exceto quando proibido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Integração com Terceiros</h2>
              <p className="text-gray-600 leading-relaxed">
                O sistema pode integrar com serviços de terceiros (como DocuSign). Essas integrações estão sujeitas aos termos dos respectivos fornecedores, e não nos responsabilizamos por problemas originados nesses serviços externos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Suspensão e Encerramento</h2>
              <p className="text-gray-600 leading-relaxed">
                Podemos suspender ou encerrar sua conta em caso de violação destes termos, não pagamento ou uso inadequado. Você pode encerrar sua conta a qualquer momento, sujeito aos termos de seu plano.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Modificações dos Termos</h2>
              <p className="text-gray-600 leading-relaxed">
                Reservamo-nos o direito de modificar estes termos periodicamente. Mudanças significativas serão comunicadas com antecedência. O uso continuado após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">12. Lei Aplicável</h2>
              <p className="text-gray-600 leading-relaxed">
                Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais competentes do Brasil, especificamente na comarca onde nossa empresa está estabelecida.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">13. Contato</h2>
              <p className="text-gray-600 leading-relaxed">
                Para questões sobre estes termos ou nossos serviços, entre em contato através dos canais disponíveis na plataforma ou pelo nosso suporte técnico.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
