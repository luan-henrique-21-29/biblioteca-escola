# Rodada 10 — Página da escola, vitrine, minha lista, recomendações, busca e celular

Atualização de 17 de novembro de 2026.

As seis melhorias ficam disponíveis no projeto:
- **A. Destaques:** banner com capas reais da edição do Leia Paraná, 8 sugestões de título, pausa e navegação manual, responsivo.
- **D. Colégio:** página com fatos verificados, endereços, contatos, foto pública da quadra (Grupo Litorânea, 2024) e foto da feira de ciências (ISEPE, 2019). Os registros de 2009, 2017, 2019 e 2026 possuem fonte e são apresentados como acontecimentos documentados, **sem inventar ano de fundação**.
- **F. Minha lista:** o leitor marca Quero ler / Estou lendo / Já li na ficha digital ou na aba Minha lista. São dados pessoais do projeto, não sincronizados com a ODILO e não representam empréstimos físicos.
- **G. Recomendações:** ordenação local determinística baseada em gêneros/autor dos livros marcados pelo aluno. Sem histórico a interface indica sugestões iniciais, não "inteligência personalizada". Sem coleta adicional e sem dados de outros alunos.
- **I. Pesquisa:** comparação normalizada, com tolerância a pequenos erros de digitação no título, autor e gênero.
- **R. Celular:** navegação inferior com quatro atalhos e aba Mais, cards ajustados, fichas, rolagem e botões acessíveis.

**Segurança:** tabela public.digital_reading_progress tem PK (user_id,book_id), FKs, CHECK no status e RLS para SELECT/INSERT/UPDATE/DELETE com auth.uid()=user_id. Revogamos privilégios de anon. A migração de produção foi aplicada no Supabase ligado ao projeto e está reproduzida no repositório.

**Limitação do teste:** as rotas públicas, pesquisa, capas, banner e página escolar são verificadas no navegador com mocks de rede quando apropriado. Persistência de lista autenticada é coberta por validação da política RLS e testes de lógica, não por simulação de conta real de aluno. Não criar contas reais ou pedir senhas apenas para automatizar verificações.

Fontes:
- Consulta Escolas da SEED PR: https://www.consultaescolas.pr.gov.br/consultaescolas/pages/templates/initial2.xhtml?codigoEstab=417&codigoMunicipio=970
- Reportagem da quadra: https://litoranea.fm/colegio-joaquim-mafra-de-guaratuba-lembra-que-prazo-para-matriculas-e-rematriculas-termina-nesta-sexta-feira-12/
- Feira de Ciências 2019: https://isepe.edu.br/noticias/momento-isepe/360-faculdade-isepe-na-feira-de-ciencias-do-colegio-joaquim-mafra
- Inclusão 2009: https://www.educacao.pr.gov.br/Noticia/Metodo-de-escola-de-Guaratuba-atrai-estudantes-especiais
- Gestão 2017: https://www.educacao.pr.gov.br/Noticia/Escolas-estaduais-do-Litoral-recebem-Premio-de-Gestao
- Formação 2026: https://www.educacao.pr.gov.br/Noticia/Parana-sera-um-dos-primeiros-estados-do-Brasil-ofertar-curso-tecnico-de-IA-na-rede-publica
