import { InstitutionalLayout } from '@/layouts/InstitutionalLayout';
import { SEOHead } from '@/components/seo/SEOHead';

const Privacidade = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Política de Privacidade BarberSoft',
    description: 'Política de privacidade e proteção de dados do BarberSoft.'
  };

  return (
    <InstitutionalLayout breadcrumbs={[{ label: 'Privacidade' }]}>
      <SEOHead
        title="Política de Privacidade"
        description="Conheça nossa política de privacidade e como protegemos seus dados. Transparência e segurança no tratamento de informações pessoais."
        canonical="/privacidade"
        schema={schema}
      />

      <article className="prose prose-gray dark:prose-invert max-w-none">
        <header className="not-prose mb-12">
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: 30 de dezembro de 2025</p>
        </header>

        <section>
          <h2>1. Introdução</h2>
          <p>
            A BarberSoft ("nós", "nosso" ou "Empresa") está comprometida em proteger sua privacidade. 
            Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
            informações quando você utiliza nosso sistema de gestão para barbearias.
          </p>
          <p>
            Ao utilizar o BarberSoft, você concorda com a coleta e uso de informações de acordo com 
            esta política. Se não concordar, por favor não utilize nossos serviços.
          </p>
        </section>

        <section>
          <h2>2. Informações que Coletamos</h2>
          
          <h3>2.1 Dados Pessoais</h3>
          <p>Coletamos as seguintes categorias de dados pessoais:</p>
          <ul>
            <li><strong>Dados de identificação:</strong> nome, e-mail, telefone, CPF/CNPJ</li>
            <li><strong>Dados de acesso:</strong> login, senha (criptografada), logs de acesso</li>
            <li><strong>Dados de pagamento:</strong> informações de cartão (processadas por terceiros)</li>
            <li><strong>Dados de uso:</strong> interações com o sistema, preferências, configurações</li>
          </ul>

          <h3>2.2 Dados de Clientes das Barbearias</h3>
          <p>
            Como processador de dados, também tratamos dados dos clientes finais das barbearias:
          </p>
          <ul>
            <li>Nome e telefone para agendamentos</li>
            <li>Histórico de serviços realizados</li>
            <li>Preferências de atendimento</li>
            <li>Data de nascimento (quando fornecido)</li>
          </ul>
        </section>

        <section>
          <h2>3. Como Utilizamos seus Dados</h2>
          <p>Utilizamos as informações coletadas para:</p>
          <ul>
            <li>Fornecer e manter nossos serviços</li>
            <li>Processar agendamentos e notificações</li>
            <li>Enviar comunicações sobre o serviço</li>
            <li>Melhorar e personalizar a experiência do usuário</li>
            <li>Cumprir obrigações legais e regulatórias</li>
            <li>Prevenir fraudes e garantir segurança</li>
            <li>Gerar estatísticas e relatórios agregados</li>
          </ul>
        </section>

        <section>
          <h2>4. Base Legal para o Tratamento</h2>
          <p>O tratamento de dados pessoais é realizado com base em:</p>
          <ul>
            <li><strong>Execução de contrato:</strong> para fornecer os serviços contratados</li>
            <li><strong>Consentimento:</strong> para comunicações de marketing</li>
            <li><strong>Legítimo interesse:</strong> para melhorias do serviço e segurança</li>
            <li><strong>Obrigação legal:</strong> para cumprimento de determinações legais</li>
          </ul>
        </section>

        <section>
          <h2>5. Compartilhamento de Dados</h2>
          <p>Compartilhamos dados apenas nas seguintes situações:</p>
          <ul>
            <li><strong>Prestadores de serviço:</strong> provedores de infraestrutura, pagamento, e-mail</li>
            <li><strong>Requisição legal:</strong> quando exigido por lei ou ordem judicial</li>
            <li><strong>Proteção de direitos:</strong> para defender nossos interesses legítimos</li>
          </ul>
          <p>
            <strong>Não vendemos seus dados pessoais</strong> para terceiros em nenhuma circunstância.
          </p>
        </section>

        <section>
          <h2>6. Segurança dos Dados</h2>
          <p>Implementamos medidas de segurança técnicas e organizacionais:</p>
          <ul>
            <li>Criptografia de dados em trânsito (TLS) e em repouso</li>
            <li>Autenticação segura e controle de acesso</li>
            <li>Monitoramento contínuo de segurança</li>
            <li>Backups regulares e plano de recuperação</li>
            <li>Treinamento de equipe em proteção de dados</li>
          </ul>
        </section>

        <section>
          <h2>7. Retenção de Dados</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para fornecer os serviços ou conforme 
            exigido por lei. Após o término da relação:
          </p>
          <ul>
            <li>Dados de conta: excluídos em até 30 dias após solicitação</li>
            <li>Dados financeiros: mantidos por 5 anos (obrigação fiscal)</li>
            <li>Logs de acesso: mantidos por 6 meses</li>
          </ul>
        </section>

        <section>
          <h2>8. Seus Direitos</h2>
          <p>Conforme a LGPD, você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de dados</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
            <li>Portabilidade dos dados</li>
            <li>Revogar consentimento</li>
            <li>Informação sobre compartilhamentos</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato pelo e-mail: 
            <a href="mailto:contato@dtsolucoesdigital.com.br"> contato@dtsolucoesdigital.com.br</a>
          </p>
        </section>

        <section>
          <h2>9. Cookies e Tecnologias de Rastreamento</h2>
          <p>Utilizamos cookies para:</p>
          <ul>
            <li>Manter sua sessão ativa</li>
            <li>Lembrar preferências</li>
            <li>Análise de uso (Google Analytics)</li>
          </ul>
          <p>
            Você pode desabilitar cookies nas configurações do navegador, porém algumas 
            funcionalidades podem não operar corretamente.
          </p>
        </section>

        <section>
          <h2>10. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças 
            significativas por e-mail ou aviso no sistema. O uso continuado após alterações 
            constitui aceitação da nova política.
          </p>
        </section>

        <section>
          <h2>11. Contato</h2>
          <p>
            Para dúvidas sobre esta política ou tratamento de dados:
          </p>
          <ul>
            <li><strong>E-mail:</strong> contato@dtsolucoesdigital.com.br</li>
            <li><strong>Encarregado de Dados (DPO):</strong> contato@dtsolucoesdigital.com.br</li>
            <li><strong>Endereço:</strong> Rua F. V de Azevedo, 07 - Cohab Nova, Cáceres-MT</li>
          </ul>
        </section>
      </article>
    </InstitutionalLayout>
  );
};

export default Privacidade;
