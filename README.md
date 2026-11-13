# Biblioteca Joaquim 📚

Sistema de biblioteca escolar para o **Colégio Estadual Prefeito Joaquim da Silva Mafra**, em Guaratuba (PR). Interface clara em azul-escuro, branco e cinza, responsiva para computadores e celulares.

## O que está implementado

- **Alunos:** cadastro com e-mail e senha, Google (Gmail e contas escolares autorizadas), perfil com nome/turma, catálogo com pesquisa por título/autor/gênero, sinopse, capa, disponibilidade, avaliações e livros relacionados.
- **Favoritos (etapa 5):** cada aluno salva ou remove livros pelo ícone de coração, acessa a aba **Favoritos** e encontra sua lista preservada entre sessões. Os dados são privados para cada conta.
- **Livros mais emprestados (etapa 5):** a página inicial do aluno mostra o ranking de títulos mais emprestados, contado a partir dos empréstimos aprovados, incluindo devolvidos. São exibidas apenas contagens agregadas, sem nomes de leitores.
- **Pesquisa avançada (etapa 6):** filtros combinados por texto, nome do autor, gênero e disponibilidade, sem diferenciar maiúsculas e acentos.
- **Fila de espera (etapa 6):** o aluno vê sua posição e a quantidade de pessoas aguardando. Após devolução ou cadastro de novo exemplar, quem alcança uma posição disponível recebe aviso **dentro do site**, mas a aprovação continua com o bibliotecário.
- **Importação (etapa 6):** bibliotecário importa planilhas `.xlsx` ou `.csv`, confere a prévia e grava até 200 exemplares de uma vez. Códigos numéricos repetidos impedem a importação inteira.
- **Solicitações:** aluno solicita livro, inclusive quando todos os exemplares estão emprestados (fila de espera por ordem de chegada). Bibliotecário aprova/recusa; cada exemplar tem **código numérico**.
- **Empréstimos:** limite e prazo configurados pelo bibliotecário, data de devolução, contagem de dias, histórico, pedidos de renovação e registro de devolução.
- **Atrasos e notificações:** alerta dentro do aplicativo, bloqueio de novos pedidos com empréstimos atrasados, notificações após aprovação, recusa, renovação ou devolução.
- **Bibliotecário:** dashboard, cadastro de livros e exemplares, fila de solicitações, devoluções, alunos, relatórios e configurações.
- **Etapa 8 — relatórios:** filtre empréstimos simultaneamente por turma, situação (aguardando retirada, em dia, atrasado ou devolvido) e intervalo de datas. Escolha entre datas de aprovação, retirada, vencimento e devolução; tabelas, gráficos, resumos por turma e exportações CSV usam os mesmos filtros. Datas seguem o horário do Paraná.
- **Retirada aprovada sem prazo automático:** pedidos aprovados ficam aguardando entrega presencial até o bibliotecário confirmar a retirada. Não há cancelamento automático por prazo. O prazo de **devolução** começa na confirmação da entrega.
- **Prévia pública:** mostra somente livros fictícios, sem acesso a históricos, empréstimos, reservas ou funções de bibliotecário. Alunos e bibliotecários precisam de autenticação e autorização real. A funcionalidade de sugerir novos livros não foi adicionada, conforme a escolha da etapa 8.
- **Administrador:** autoriza o e-mail de um bibliotecário. O acesso é ativado após o funcionário confirmar o e-mail e fazer login.
- **Segurança:** Postgres no Supabase, políticas RLS, checagem de permissões no servidor e funções SQL que evitam empréstimo do mesmo exemplar para dois usuários.

> **Estado da entrega:** o site já está hospedado no GitHub Pages e a prévia pública mostra somente livros fictícios, sem acesso a contas. Para ativar contas reais de alunos e bibliotecários, é necessário conectar um projeto Supabase e configurar o login Google. Nenhum usuário público pode escolher ser bibliotecário: a permissão é atribuída no banco por convite do administrador.

## Como executar no seu computador

1. Instale Node.js 20.19+ (ou versão compatível com Vite 6).
2. Na pasta do projeto, execute: `npm install`
3. Crie um projeto em [supabase.com](https://supabase.com).
4. No **SQL Editor** do Supabase, execute os arquivos SQL, **nesta ordem**:
   - `supabase/migrations/20261112000000_initial.sql` (somente num projeto novo; não execute novamente se a biblioteca já foi instalada).
   - `supabase/migrations/20261112010000_favorites_popularity.sql` (migração da etapa 5; execute também nas instalações existentes).
   - `supabase/migrations/20261112020000_search_queue_import.sql` (migração da etapa 6).
   - `supabase/migrations/20261112030000_security_and_notifications.sql` (avisos e segurança).
   - `supabase/migrations/20261112040000_circulation.sql` (retirada física, condições e comprovantes).
   - `supabase/migrations/20261112050000_featured_books.sql` (livros em destaque).
   - `supabase/migrations/20261112060000_atomic_book_creation.sql` (cadastro transacional de livros; **execute por último**).
5. Copie `.env.example` para `.env.local` e preencha:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = chave **publishable/anon** (nunca service_role).
6. Execute `npm test` para validar as planilhas e `npm run dev` para abrir o site.

### Configurar login Google (Gmail e @escola)

1. No **Google Cloud Console**, crie um projeto, configure a tela de consentimento e credenciais **OAuth 2.0 Web application**. Caso seja necessário, o administrador do Google Workspace escolar deve autorizar o aplicativo.
2. No Supabase, em **Authentication > Providers > Google**, habilite o provedor e informe o Client ID e o Client Secret do Google.
3. No Google Cloud, cadastre o **callback de OAuth que o Supabase mostra** (padrão: `https://SEU-PROJETO.supabase.co/auth/v1/callback`) como Authorized redirect URI.
4. No Supabase, em **Authentication > URL Configuration**, cadastre a URL do site em **Site URL** e em **Redirect URLs** (no desenvolvimento, `http://localhost:5173/**`). Aplique sua URL de produção quando hospedar.
5. Em **Authentication > Providers > Email**, mantenha a confirmação de e-mail habilitada. Configure SMTP para produção (o envio padrão do Supabase tem restrições).
6. Teste uma conta `@gmail.com` e uma conta escolar que esteja autorizada pelo domínio Google Workspace da rede. O domínio escolar **não exige código especial**: depende da permissão do Google Workspace e do OAuth configurado.

> A escola usa a rede de ensino do Paraná. Não é possível garantir login de todos os e-mails escolares sem testes e eventual liberação pelo administrador do domínio.

### Criar o primeiro administrador com segurança

O formulário público cria apenas **alunos**. Assim ninguém escolhe por conta própria ter acesso de bibliotecário.

1. Cadastre sua própria conta e confirme seu e-mail.
2. No **SQL Editor** do Supabase, substitua o e-mail abaixo pelo da conta responsável e execute **apenas uma vez**:

```sql
update public.profiles
set role = 'admin'
where email = 'EMAIL_DO_ADMINISTRADOR_AQUI';
```

3. Saia e entre novamente. A aba **Configurações > Cadastro de bibliotecários** aparecerá para o administrador.
4. Cadastre o e-mail do funcionário. A pessoa usa esse mesmo e-mail para criar a conta e confirmar o acesso; ao entrar, sua função será atribuída automaticamente.
5. Bibliotecários conseguem alterar regras de empréstimo, aprovar pedidos e cadastrar exemplares; alunos não conseguem.

### Regras importantes

- Cada título precisa de **ao menos um exemplar** com código numérico para aceitar solicitação.
- Solicitações entram na fila; somente a **mais antiga pendente** do título pode ser aprovada primeiro.
- Se não houver exemplar disponível, o pedido continua pendente.
- Um empréstimo só passa a contar depois da **aprovação** do bibliotecário.
- Um aluno com livro vencido não consegue pedir outro.
- Renovações precisam de aprovação e são bloqueadas quando há fila de espera ou o livro já está atrasado.
- Os alertas de prazo são exibidos quando o aluno abre o site; não há disparo de e-mail nem rotina automática rodando em segundo plano.

### Identidade visual

O cabeçalho referencia o emblema da escola encontrado em um cartaz de matrículas de 2024 publicado pela [Rádio Litorânea](https://litoranea.fm/colegio-joaquim-mafra-de-guaratuba-lembra-que-prazo-para-matriculas-e-rematriculas-termina-nesta-sexta-feira-12/). O recorte é feito via CSS, a imagem continua hospedada na fonte. **Antes do uso oficial, peça o arquivo do logotipo à escola e sua autorização**, e substitua a imagem remota por um arquivo local. O favicon é um símbolo genérico de livro, não o emblema oficial.

### Teste rápido

1. Faça login com um administrador e cadastre um livro e um exemplar numérico.
2. Em outro navegador, crie um aluno, busque o título e clique em **Solicitar**.
3. No painel do bibliotecário, abra **Solicitações**, aprove e verifique que o aluno vê a data de devolução.
4. Solicite outro empréstimo do mesmo título com outra conta para verificar a fila de espera.
5. Faça uma solicitação de renovação e aprove/recuse como bibliotecário.
6. Registre a devolução. Confira os painéis, o histórico e os relatórios.
7. Ajuste o prazo e o limite em **Configurações** e repita os testes.
8. Como aluno, clique no coração de um livro no catálogo; confira a aba **Favoritos**. Atualize a página e confirme que o favorito continua salvo. Clique novamente para remover.
9. Depois de aprovar empréstimos, entre como aluno e confira a seção **Livros mais emprestados** na página inicial. A contagem soma empréstimos ativos e devolvidos e não revela quais alunos pegaram os livros.
10. Confira se a aba **Favoritos** de outro aluno não mostra livros salvos por uma conta diferente.
11. No catálogo, combine autor, gênero e disponibilidade. Teste o botão **Limpar filtros**.
12. Solicite o mesmo título com dois alunos e verifique em **Meus livros** a posição de cada um na fila (botão **Atualizar fila**).
13. Registre uma devolução ou adicione um exemplar e verifique em **Avisos > Atualizar avisos** a notificação da primeira pessoa elegível. Não há aprovação automática.
14. Como bibliotecário, acesse **Acervo > Importar planilha**, baixe o modelo, envie um arquivo `.xlsx` ou `.csv` e confira a prévia. Teste também um código duplicado para garantir que nenhum dos itens do arquivo seja gravado.

## Publicar no GitHub Pages (corrige página em branco)

O GitHub Pages não compila JSX/React automaticamente ao publicar a pasta raiz. A partir desta versão há um workflow `.github/workflows/deploy-pages.yml` que compila Vite e publica **dist/** com o caminho correto `/biblioteca-escola/`.

1. Abra **Settings > Pages** deste repositório: https://github.com/luan-henrique-21-29/biblioteca-escola/settings/pages
2. Em **Build and deployment > Source**, escolha **GitHub Actions** (e não Deploy from a branch).
3. Abra **Actions > Publicar Biblioteca Joaquim no GitHub Pages** e execute **Run workflow** na branch `main`, se não iniciar automaticamente.
4. Após o deploy concluído, abra https://luan-henrique-21-29.github.io/biblioteca-escola/
5. Sem Supabase configurado, o site exibe uma tela inicial com **Explorar demonstração do aplicativo**: você verá uma interface com dados fictícios (não salva dados reais).
6. Para ativar login e banco de dados, configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Settings > Secrets and variables > Actions > Variables** (essas duas são públicas no navegador, NÃO use service_role). Configure também as migrações SQL e as URLs de retorno do Google no Supabase. Execute o workflow novamente após configurar as variáveis.

**Importante:** se não selecionar **GitHub Actions** na configuração do Pages, o site continuará servindo o `index.html` do código-fonte, que não funciona sozinho no navegador.

## Melhorias de circulação, acesso e experiência (etapa 7)

- **Permissões realmente separadas:** a prévia pública oferece somente consulta de títulos fictícios, sem áreas de aluno nem de funcionário. A função de bibliotecário não pode ser escolhida em um menu. Com Supabase conectado, todos criam contas de aluno, e apenas funcionários autorizados pelo administrador recebem o papel de bibliotecário via verificação no banco.
- **Confirmação física de retirada:** o pedido aprovado reserva o exemplar, mas a biblioteca precisa confirmar a entrega e registrar seu estado (novo, bom, regular ou danificado). A data de devolução é ajustada quando o aluno retira o livro.
- **Conservação na devolução:** o bibliotecário registra o estado físico e, opcionalmente, observações ao receber o exemplar.
- **Histórico de movimentações:** aprovações, retiradas, renovações e devoluções ficam registradas em uma tabela protegida, com permissões no banco.
- **Comprovantes digitais:** opção de abrir e imprimir/salvar PDF do registro de aprovação, retirada e devolução. Estes comprovantes são informativos e não substituem a conferência presencial.
- **Catálogo ordenável:** título, autor, ano, popularidade, novidades e favoritos primeiro.
- **Livros novos e destaques:** o bibliotecário pode marcar um título como destaque, que aparece na página inicial do aluno junto com os recém-cadastrados.
- **Avisos em destaque:** notificações não lidas aparecem na página inicial do aluno.
- **Dashboard completo:** agenda de próximas devoluções, retiradas aguardando confirmação, solicitações e títulos mais procurados.
- **Aplicativo para celular:** navegação inferior em telas pequenas e versão instalável com manifesto PWA e ícones próprios. O sistema requer internet para operações reais; ele não salva dados pessoais offline.

> Para ativar as novas funções, aplique as migrações SQL 40000 e 50000 após as quatro anteriores. O banco e as permissões não são simulados nem substituídos pelo modo de demonstração.

## Novas melhorias de administração e segurança (etapa 7)

- **Guia de configuração dentro do próprio site** para ativar Supabase, login com e-mail/senha e Google OAuth.
- **Administração de funcionários:** o administrador pode revogar convites e acessos de bibliotecários. A mudança é aplicada nas permissões do banco por uma função SQL autorizada.
- **Relatórios em CSV:** o bibliotecário pode exportar o catálogo dos exemplares e um relatório de empréstimos, com turma, identificação do exemplar e prazos. As exportações incluem dados pessoais e devem ser usadas somente pela equipe autorizada.
- **Etiquetas imprimíveis:** no catálogo, use **Imprimir etiquetas** para obter etiquetas A4 com nome do livro e código numérico do exemplar.
- **Avisos de devolução:** ao entrar ou atualizar a biblioteca, a conta do aluno recebe notificações internas sobre devoluções próximas (até três dias) ou atrasadas, com prevenção de repetição excessiva. Enquanto a página está visível, os dados também são atualizados periodicamente.
- **Proteção extra:** não é permitida solicitação de outro exemplar de um título que o aluno já tem emprestado. Incluído teste de tela real no Chrome e uma tela amigável em caso de erro.

> A migração `20261112030000_security_and_notifications.sql` deve ser executada para habilitar essas regras em instalações Supabase existentes. As regras do backend não são simuladas pelo modo demonstração.

## Hospedagem

É um projeto **Vite + React**. Pode ser publicado em Vercel, Netlify ou serviço equivalente, usando **Build command** `npm run build` e **Output directory** `dist`. Configure as duas variáveis de ambiente no painel da hospedagem e libere a URL final no Supabase e no Google OAuth.

## Privacidade

Trata-se de um aplicativo escolar, potencialmente usado por menores de idade. Cadastre apenas informações necessárias, não publique dados pessoais e peça validação à escola antes do uso real. Para produção, revise a política de proteção de dados da escola e os procedimentos da LGPD. O projeto não coleta números de documentos nem datas de nascimento.

## Tecnologias

React 19, Vite 6, Supabase (Postgres, Auth, OAuth, RLS), lucide-react e Recharts. Interface em português brasileiro.

## Planilha de importação (etapa 6)

No painel do bibliotecário, vá em **Acervo > Importar planilha > Baixar modelo CSV**. Você pode abrir o arquivo no Excel, preencher e salvar em formato `.xlsx` ou `.csv`.

| codigo | titulo | autor | genero | sinopse | ano | capa |
| --- | --- | --- | --- | --- | --- | --- |
| 1001 | Dom Casmurro | Machado de Assis | Romance | Literatura brasileira | 1899 | |
| 1002 | O Pequeno Príncipe | Antoine de Saint-Exupéry | Ficção | História de um príncipe | 1943 | |

- Colunas obrigatórias: **codigo, titulo, autor, genero**. Opcionais: **sinopse, ano, capa**.
- O código é numérico, único por exemplar. Formate como **texto** no Excel para manter zeros à esquerda.
- Títulos e autores iguais podem indicar exemplares diferentes do mesmo livro.
- Se houver código duplicado no arquivo ou no banco, a importação **inteira** é cancelada.
- Limites: 200 exemplares e arquivo de até 2 MB por importação.
- Avisos de disponibilidade são **internos**, aparecem ao entrar ou atualizar a página, e não são mensagens de e-mail.

Execute `npm test && npm run build` para verificar os testes de planilhas e a compilação. O GitHub Actions executa ambos automaticamente.

## Configuração sem experiência em programação

Leia [CONFIGURAR.md](CONFIGURAR.md) para um passo a passo simples de ativação do login e do banco, com links diretos para cada configuração. Não envie o Client Secret do Google nem a chave `service_role` para o GitHub ou para terceiros.

### Correção de cadastro de livros

A migração `20261112060000_atomic_book_creation.sql` cria uma operação SQL única para salvar o título e seu primeiro exemplar. Se o código já existir, a operação inteira falha, sem deixar um título vazio no acervo. Os formulários de cadastro, edição e adição de exemplar permanecem abertos quando o banco retorna erro; fecham somente após a confirmação da gravação.

## Testar relatórios da etapa 8

Faça login com uma conta de bibliotecário autorizada. Em **Relatórios**, escolha **Turma**, **Situação**, **Tipo de data**, **Data inicial** e **Data final**. Confirme que os indicadores, gráfico, resumo de turmas e registros mudam juntos. Use **Exportar empréstimos filtrados** ou **Exportar resumo por turma** para baixar somente os registros selecionados. **Exportar acervo completo** continua disponível separadamente. As datas são inclusivas no horário `America/Sao_Paulo`.

Não é necessária nova migração SQL para esses filtros: os campos já estão nas tabelas e a consulta é restrita pela autorização de bibliotecário e pelas políticas RLS existentes. No primeiro acesso, aplique as sete migrações documentadas em `CONFIGURAR.md`. O login real só funcionará após configurar um projeto Supabase e o Google OAuth na escola.

### Diagnóstico de configuração do login

O aplicativo valida as variáveis públicas do Supabase antes de abrir o painel de autenticação. Se faltar URL ou chave, houver valores de exemplo ou a URL estiver malformada, o visitante recebe uma orientação de configuração em vez de uma tela branca. Uma chave pública válida não dá permissões de bibliotecário: esse acesso depende do banco e de RLS.

## Banco de dados real (13/11/2026)

O projeto Supabase **Biblioteca Joaquim** foi criado na região `sa-east-1` e as sete migrações SQL foram aplicadas. A URL e a chave **publicável** ficam em `src/publicSupabaseConfig.js` como padrão, permitindo que o GitHub Pages abra a tela de login sem configurar variáveis no GitHub. Credenciais privadas, tokens de serviço e senhas **nunca** devem ser inseridos nesse arquivo. Variáveis Vite definidas explicitamente no build têm prioridade.

O login por e-mail/senha usa o Supabase Auth. Para habilitar o botão Google, ainda é necessário cadastrar um OAuth Client no Google Cloud e ativar Google em Supabase → Authentication → Providers; definir Site URL `https://luan-henrique-21-29.github.io/biblioteca-escola/` e permitir o mesmo endereço em Redirect URLs. A URL de callback do Google é `https://ixbgbkjhpzytvzirtxfv.supabase.co/auth/v1/callback`. O GitHub Pages não pode fazer sozinho essa configuração externa.

**Acervo real:** nenhuma obra foi marcada como exemplar físico disponível sem inventário confirmado pela escola. Um bibliotecário autorizado pode importar o inventário real por CSV/Excel.

### Matrícula e leitura digital

Cadastro do aluno: nome, turma, matrícula/CGM (6 a 12 números) e e-mail. Quem entra com Google completa turma e matrícula no primeiro acesso; Google OAuth exige ativação do provedor no Google Cloud e Supabase. A matrícula digitada não verifica automaticamente vínculo na SEED. Novas contas têm sempre papel `reader`.

A aba **Ler online** lista seis obras citadas em publicações oficiais do Leia Paraná, com link para `https://leiaparana.odilo.us/`. Os arquivos dos e-books não são copiados nem hospedados; a leitura exige login e disponibilidade na plataforma oficial. Não são exemplares físicos da biblioteca.

### Login por CGM (modo atual)

O aluno se cadastra com nome, turma, CGM e senha (mínimo 10 caracteres), **sem e-mail**. A Edge Function `student-cgm-signup` cria o usuário com endereço técnico interno e confirmação administrativa, e o Supabase Auth valida CGM+senha através desse identificador técnico. A chave de serviço fica exclusivamente no backend. A função limita tentativas por CGM e IP. A interface não oferece recuperação de senha automática: o aluno deve procurar a biblioteca, que deve estabelecer um procedimento seguro de confirmação de identidade antes de redefinir a senha. O CGM informado pelo usuário não é validado junto à SEED. O aluno não pode alterar seu CGM depois do cadastro. Contas antigas criadas com e-mail não são migradas automaticamente. O Google OAuth foi retirado da interface.

**Implantação:** implante a função `supabase/functions/student-cgm-signup/index.ts` com `verify_jwt=false`, mantendo `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente como segredos do Supabase. Execute a migração de limites de cadastro e a de bloqueio de CGM. Não coloque a chave de serviço no GitHub Pages.
