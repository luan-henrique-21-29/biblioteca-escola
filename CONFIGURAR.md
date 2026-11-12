# Ativar o login real da Biblioteca Joaquim

Este guia é para quem administra o projeto e quer transformar a demonstração em um sistema real de biblioteca escolar.

**O site já está publicado:** https://luan-henrique-21-29.github.io/biblioteca-escola/

## 1. Criar um projeto no Supabase

Entre em https://supabase.com/dashboard/projects, faça login e crie um novo projeto. Guarde a senha do banco **fora** do GitHub.

No SQL Editor do Supabase, execute **nessa ordem**, uma única vez:

1. [1 — Tabelas e permissões](supabase/migrations/20261112000000_initial.sql)
2. [2 — Favoritos e populares](supabase/migrations/20261112010000_favorites_popularity.sql)
3. [3 — Fila de espera e planilhas](supabase/migrations/20261112020000_search_queue_import.sql)
4. [4 — Segurança e avisos](supabase/migrations/20261112030000_security_and_notifications.sql)

Se as primeiras três já foram executadas, execute **somente a quarta**. Não reinicie o banco nem rode a primeira migração duas vezes.

## 2. Ativar login por e-mail e senha

No painel Supabase, abra **Authentication > Providers > Email** e confirme que o login por e-mail está habilitado. Mantenha a confirmação do endereço ativada; configure o envio de e-mail (SMTP) para uso real com vários alunos.

Em **Authentication > URL Configuration** configure:
- **Site URL:** `https://luan-henrique-21-29.github.io/biblioteca-escola/`
- **Redirect URLs:** inclua `https://luan-henrique-21-29.github.io/biblioteca-escola/**`.

O formulário da biblioteca cria **apenas contas de aluno**. O primeiro administrador é configurado manualmente via SQL por alguém responsável da escola.

## 3. Ligar Supabase ao GitHub Pages

No Supabase, encontre **Project URL** e a chave pública **anon/publishable** em **Project Settings > API / API Keys**.

No GitHub abra: https://github.com/luan-henrique-21-29/biblioteca-escola/settings/variables/actions

Clique **New repository variable** e crie:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase (`https://...supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Chave **anon/publishable**, pública |

São valores públicos usados pelo navegador. **NUNCA** configure `service_role` ou a senha do banco nessa opção; essas credenciais são secretas.

Depois abra https://github.com/luan-henrique-21-29/biblioteca-escola/actions/workflows/deploy-pages.yml e clique **Run workflow**, na branch `main`.

## 4. Ativar Google (Gmail e contas @escola)

No Google Cloud Console, em https://console.cloud.google.com/apis/credentials:
- Configure a tela de consentimento OAuth do seu projeto.
- Crie credenciais **OAuth client ID**, tipo **Web application**.
- Insira o callback fornecido pelo Supabase, geralmente `https://SEU-PROJETO.supabase.co/auth/v1/callback`, em **Authorized redirect URIs**.
- No Supabase, abra **Authentication > Providers > Google**, habilite o Google, cole o **Client ID** e o **Client Secret** diretamente no painel do Supabase (não no repositório).

O login com Gmail pessoal pode funcionar assim que o provedor estiver corretamente configurado. Para os e-mails institucionais `@escola.pr.gov.br`, o administrador do Google Workspace escolar pode precisar permitir o aplicativo. Isso deve ser testado com a autorização da escola.

## 5. Criar primeiro administrador da biblioteca

Faça um cadastro de usuário pelo site, confirme seu e-mail e depois, no SQL Editor do Supabase, substitua pelo endereço real da conta responsável:

```sql
update public.profiles
set role='admin'
where email='EMAIL_DO_ADMIN_AQUI';
```

Execute uma vez e depois saia e entre de novo no site. A aba **Configurações** terá o cadastro de bibliotecários. Coloque o e-mail dos funcionários autorizados; eles precisam usar o mesmo endereço confirmado para assumir o cargo. O administrador também pode revogar o acesso.

**Atenção:** não dê acesso administrativo a todos os alunos e não compartilhe contas ou senhas.

## 6. Cadastrar e emprestar livros

Entre como bibliotecário e:
1. Abra **Acervo** para cadastrar livros, código numérico e quantidade de exemplares.
2. Opcional: use **Importar planilha** para importar um Excel ou CSV com os livros reais da biblioteca.
3. O aluno entra com e-mail/senha ou Google, procura o livro e solicita.
4. O bibliotecário abre **Solicitações**, aprova e registra a retirada.
5. Em **Meus livros**, o aluno vê a data de devolução, histórico e solicitações de renovação.
6. Na devolução, o bibliotecário usa **Registrar devolução**; o sistema avisa quem está na fila.
7. O funcionário pode exportar relatórios e imprimir etiquetas com códigos numéricos.

## Antes de usar com alunos de verdade

Peça autorização à direção. Revise a proteção dos dados pessoais, os privilégios de cada funcionário, as regras da LGPD e os textos de privacidade do sistema. A demonstração contém **livros fictícios** e não representa o acervo da escola. O logo localizado em material público deverá ser substituído por um arquivo autorizado da própria escola.

## Diagnóstico

- **Aparece o guia em vez do login:** faltam as variáveis públicas na configuração do GitHub Pages ou ainda não houve nova publicação depois de adicioná-las.
- **Aparece erro de tabelas/permissões:** execute as quatro migrações em ordem. Não tente criar tabelas manualmente.
- **Login Google não funciona:** revise URLs autorizadas, credenciais no Supabase e permissões do Google Workspace.
- **E-mail de confirmação não chega:** revise o provedor de e-mail e SMTP no Supabase.
- **Tela branca:** abra o menu **Actions** do GitHub e veja os testes automatizados; recarregue o site com Ctrl + F5.
