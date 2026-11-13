# Catálogo digital Leia Paraná: 50 edições verificadas

Data da auditoria: **13 de novembro de 2026**.

Foram encontrados 114 ebooks no catálogo público da plataforma Leia Paraná (ODILO). Foram selecionados **50 títulos diferentes**, distribuídos por **11 categorias**. Em cada um, o script `scripts/verify_odilo_catalog.mjs` confirmou:

- ficha individual `https://leiaparana.odilo.us/info/<slug>-<id>` abrindo sem redirecionamento indevido;
- título, autor e controle de empréstimo na página pública;
- imagem real da edição disponibilizada pelo próprio domínio `covers.odilo.io` verificada pelos bytes do arquivo;
- ISBN e ano da edição, quando informados pela fonte.

O resultado está versionado em `data/verified-odilo-catalog.json` e importado pelo SQL da migração `20261113070000_curated_verified_50_odilo_editions.sql`. Não inventar outros títulos, capas ou links. Não usar URL da página inicial para fingir link individual. Disponibilidade de empréstimo digital depende de autenticação @escola e regras da plataforma, e pode mudar. Não há inventário físico da escola comprovado; não cadastrar exemplares físicos com base nos ebooks.

O texto de sinopse é um trecho resumido a partir do material público da edição e não substitui a descrição editorial completa. O ano exibido é o **ano desta edição digital**. Os links são referências para a plataforma externa e não permitem contornar login, licenças, DRM ou captchas.

## Revalidar

Executar o workflow GitHub Actions **Verificar edições públicas do Leia Paraná** quando desejar auditar o catálogo novamente. A execução apenas verifica, **não sobrescreve automaticamente o Supabase**; qualquer atualização deverá passar por revisão antes da publicação.
