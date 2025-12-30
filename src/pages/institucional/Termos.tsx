import { InstitutionalLayout } from '@/layouts/InstitutionalLayout';
import { SEOHead } from '@/components/seo/SEOHead';

const Termos = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Termos de Uso BarberSoft',
    description: 'Termos e condições de uso do sistema BarberSoft.'
  };

  return (
    <InstitutionalLayout breadcrumbs={[{ label: 'Termos de Uso' }]}>
      <SEOHead
        title="Termos de Uso"
        description="Leia os termos e condições de uso do BarberSoft. Entenda seus direitos e responsabilidades ao utilizar nosso sistema de gestão para barbearias."
        canonical="/termos"
        schema={schema}
      />

      <article className="prose prose-gray dark:prose-invert max-w-none">
        <header className="not-prose mb-12">
          <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-muted-foreground">Última atualização: 30 de dezembro de 2025</p>
        </header>

        <section>
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou usar o BarberSoft ("Serviço"), você concorda em cumprir estes 
            Termos de Uso. Se você não concordar com qualquer parte destes termos, não 
            poderá acessar o Serviço.
          </p>
        </section>

        <section>
          <h2>2. Descrição do Serviço</h2>
          <p>
            O BarberSoft é uma plataforma de gestão para barbearias que oferece:
          </p>
          <ul>
            <li>Sistema de agendamento online</li>
            <li>Gestão de clientes e profissionais</li>
            <li>Controle financeiro e comissões</li>
            <li>Automação de marketing via WhatsApp</li>
            <li>Relatórios e dashboards</li>
            <li>Integração com atendente de IA</li>
          </ul>
        </section>

        <section>
          <h2>3. Cadastro e Conta</h2>
          <h3>3.1 Requisitos</h3>
          <p>Para usar o Serviço, você deve:</p>
          <ul>
            <li>Ter pelo menos 18 anos de idade</li>
            <li>Fornecer informações verdadeiras e atualizadas</li>
            <li>Manter a confidencialidade de sua senha</li>
            <li>Notificar imediatamente sobre uso não autorizado</li>
          </ul>

          <h3>3.2 Responsabilidade pela Conta</h3>
          <p>
            Você é responsável por todas as atividades realizadas em sua conta. 
            O BarberSoft não se responsabiliza por acessos não autorizados decorrentes 
            de falha na proteção de suas credenciais.
          </p>
        </section>

        <section>
          <h2>4. Uso Permitido</h2>
          <p>Você concorda em usar o Serviço apenas para fins legais e de acordo com estes Termos. É proibido:</p>
          <ul>
            <li>Violar leis ou regulamentos aplicáveis</li>
            <li>Enviar spam ou conteúdo não solicitado</li>
            <li>Transmitir vírus ou código malicioso</li>
            <li>Tentar acessar sistemas não autorizados</li>
            <li>Copiar, modificar ou distribuir o software</li>
            <li>Usar o serviço para fins ilegais ou fraudulentos</li>
            <li>Revender ou sublicenciar o acesso ao Serviço</li>
          </ul>
        </section>

        <section>
          <h2>5. Planos e Pagamento</h2>
          <h3>5.1 Assinaturas</h3>
          <p>
            O BarberSoft oferece diferentes planos de assinatura. Os preços e recursos 
            de cada plano estão disponíveis em nosso site.
          </p>

          <h3>5.2 Cobrança</h3>
          <ul>
            <li>Cobranças são recorrentes (mensal ou anual)</li>
            <li>O valor é debitado automaticamente no cartão cadastrado</li>
            <li>Não há reembolso por períodos parciais</li>
          </ul>

          <h3>5.3 Alterações de Preço</h3>
          <p>
            Podemos modificar os preços mediante aviso prévio de 30 dias. 
            O novo valor será aplicado no próximo ciclo de cobrança.
          </p>
        </section>

        <section>
          <h2>6. Período de Teste</h2>
          <p>
            Oferecemos período de teste gratuito conforme anunciado. Ao final do teste, 
            a assinatura será automaticamente convertida para o plano escolhido, salvo 
            cancelamento prévio.
          </p>
        </section>

        <section>
          <h2>7. Cancelamento</h2>
          <h3>7.1 Pelo Usuário</h3>
          <p>
            Você pode cancelar sua assinatura a qualquer momento através das configurações 
            da conta ou entrando em contato conosco. O acesso permanece até o fim do 
            período pago.
          </p>

          <h3>7.2 Pelo BarberSoft</h3>
          <p>
            Reservamo-nos o direito de suspender ou cancelar contas que violem estes Termos, 
            sem aviso prévio e sem direito a reembolso.
          </p>
        </section>

        <section>
          <h2>8. Propriedade Intelectual</h2>
          <p>
            O BarberSoft e todo seu conteúdo, recursos e funcionalidades são de 
            propriedade exclusiva da Empresa e protegidos por leis de propriedade 
            intelectual. Você recebe uma licença limitada, não exclusiva e não 
            transferível para uso do Serviço.
          </p>
        </section>

        <section>
          <h2>9. Dados e Privacidade</h2>
          <p>
            O tratamento de dados pessoais é regido por nossa <a href="/privacidade">Política de Privacidade</a>. 
            Ao usar o Serviço, você concorda com as práticas descritas nessa política.
          </p>
          <p>
            Você mantém a propriedade dos dados que insere no sistema. Garantimos backup 
            e segurança, mas recomendamos que mantenha cópias próprias.
          </p>
        </section>

        <section>
          <h2>10. Limitação de Responsabilidade</h2>
          <p>
            O BarberSoft é fornecido "como está". Não garantimos que o Serviço será 
            ininterrupto ou livre de erros. Em nenhum caso seremos responsáveis por:
          </p>
          <ul>
            <li>Lucros cessantes ou perda de dados</li>
            <li>Danos indiretos, incidentais ou consequenciais</li>
            <li>Falhas decorrentes de terceiros (internet, hardware)</li>
          </ul>
          <p>
            Nossa responsabilidade total está limitada ao valor pago nos últimos 12 meses.
          </p>
        </section>

        <section>
          <h2>11. Indenização</h2>
          <p>
            Você concorda em indenizar e isentar o BarberSoft de quaisquer reclamações, 
            danos ou despesas decorrentes de:
          </p>
          <ul>
            <li>Seu uso do Serviço</li>
            <li>Violação destes Termos</li>
            <li>Violação de direitos de terceiros</li>
          </ul>
        </section>

        <section>
          <h2>12. Modificações</h2>
          <p>
            Podemos modificar estes Termos a qualquer momento. Notificaremos sobre 
            mudanças materiais com 30 dias de antecedência. O uso continuado após 
            alterações constitui aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2>13. Disposições Gerais</h2>
          <ul>
            <li><strong>Legislação:</strong> Estes Termos são regidos pelas leis brasileiras</li>
            <li><strong>Foro:</strong> Foro da Comarca de Cáceres/MT</li>
            <li><strong>Integralidade:</strong> Estes Termos constituem o acordo integral entre as partes</li>
            <li><strong>Renúncia:</strong> A não exigência de qualquer direito não constitui renúncia</li>
          </ul>
        </section>

        <section>
          <h2>14. Contato</h2>
          <p>
            Para dúvidas sobre estes Termos:
          </p>
          <ul>
            <li><strong>E-mail:</strong> contato@dtsolucoesdigital.com.br</li>
            <li><strong>Endereço:</strong> Rua F. V de Azevedo, 07 - Cohab Nova, Cáceres-MT</li>
          </ul>
        </section>
      </article>
    </InstitutionalLayout>
  );
};

export default Termos;
