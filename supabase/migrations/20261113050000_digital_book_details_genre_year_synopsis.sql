-- Metadados editoriais públicos das obras digitais.
-- As recomendações Leia Paraná usam exclusivamente o portal oficial:
-- não supor URL individual, licença ativa por turma ou exemplar físico da escola.
alter table public.digital_reading_recommendations
 add column if not exists genre text not null default 'Literatura',
 add column if not exists published_year integer,
 add column if not exists synopsis text not null default '';

update public.digital_reading_recommendations as b
set genre=v.genre, published_year=v.published_year, synopsis=v.synopsis
from (values
(1,'Fantasia',1900,'Dorothy é levada por um ciclone a uma terra desconhecida. Para voltar ao Kansas, parte em direção à Cidade das Esmeraldas e encontra companheiros que também procuram realizar seus desejos.'),
(2,'Aventura',1883,'Após encontrar um mapa de tesouro, o jovem Jim Hawkins embarca numa viagem marítima cheia de perigos. Entre piratas e alianças inesperadas, ele precisa descobrir em quem confiar.'),
(3,'Fantasia',1865,'Ao seguir um coelho apressado, Alice entra num mundo de acontecimentos absurdos, personagens excêntricos e regras que mudam a todo momento.'),
(4,'Romance brasileiro',1881,'Narrada por Brás Cubas depois de sua morte, a história revisita sua vida, seus amores e suas ambições, expondo com ironia os costumes da sociedade de sua época.'),
(5,'Romance indianista',1865,'No Ceará colonial, Iracema, jovem indígena tabajara, e Martim, português recém-chegado, vivem um amor marcado por encontros culturais, conflitos e perdas.'),
(6,'Aventura',1873,'Phileas Fogg aposta que pode dar a volta ao mundo em apenas oitenta dias. Acompanhado por seu criado Passepartout, enfrenta imprevistos para cumprir o desafio.'),
(101,'Romance brasileiro',1899,'Bento Santiago conta suas memórias, do amor juvenil por Capitu ao casamento e às suspeitas que transformam seu olhar sobre o passado. Um romance sobre ciúme e a dificuldade de conhecer a verdade.'),
(102,'Romance indianista',1865,'No Ceará colonial, Iracema, jovem indígena tabajara, e Martim, português recém-chegado, vivem um amor marcado por encontros culturais, conflitos e perdas.'),
(103,'Novela e sátira',1882,'O médico Simão Bacamarte funda uma casa de tratamento em Itaguaí e passa a internar habitantes segundo suas teorias. O conto questiona os limites entre razão, poder e loucura.'),
(104,'Conto',1884,'Camilo e Rita vivem um relacionamento secreto. Quando surgem ameaças, a confiança nas previsões de uma cartomante influencia decisões de consequências inesperadas.'),
(105,'Romance',1844,'Na sociedade carioca do século XIX, a jovem Carolina desperta os sentimentos de Augusto durante uma temporada na Ilha de Paquetá. O romance gira em torno de promessas, encontros e amadurecimento.'),
(106,'Romance brasileiro',1881,'Narrada por Brás Cubas depois de sua morte, a história revisita sua vida, seus amores e suas ambições, expondo com ironia os costumes da sociedade de sua época.')
) as v(id,genre,published_year,synopsis)
where b.id=v.id;

update public.digital_reading_recommendations
set access_url='https://leiaparana.odilo.us/'
where platform='Leia Paraná';
