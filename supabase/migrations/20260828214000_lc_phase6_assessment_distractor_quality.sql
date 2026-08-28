with replacements(question_id,option_id,new_label) as (
  values
    ('2205354f-30ef-495d-b12a-968cf61094b5'::uuid,'a','Manter uma expressão única, mas adicionar comentários explicando cada trecho.'),
    ('2205354f-30ef-495d-b12a-968cf61094b5'::uuid,'c','Extrair apenas o cálculo final para uma função e manter as condições embutidas.'),
    ('2205354f-30ef-495d-b12a-968cf61094b5'::uuid,'d','Testar somente valores muito acima e muito abaixo do limite.'),
    ('4e6c000d-474f-42de-b46a-d9be3e4e212e'::uuid,'b','Quando duas condições pertencem ao mesmo nível, mesmo que possam ser combinadas.'),
    ('4e6c000d-474f-42de-b46a-d9be3e4e212e'::uuid,'c','Quando todas as condições podem ser avaliadas de uma vez, mas queremos separá-las visualmente.'),
    ('4e6c000d-474f-42de-b46a-d9be3e4e212e'::uuid,'d','Quando qualquer expressão booleana possui mais de um operador.'),
    ('14e23862-2fee-47d3-8354-18bdc73855cb'::uuid,'a','Porque substitui parte dos testes ao documentar os casos esperados.'),
    ('14e23862-2fee-47d3-8354-18bdc73855cb'::uuid,'c','Porque força regras complexas a caberem em uma única cadeia SE/SENÃO.'),
    ('14e23862-2fee-47d3-8354-18bdc73855cb'::uuid,'d','Porque valida automaticamente os dados representados na tabela.'),
    ('e92f6ccc-31d0-41b9-8c2f-d2ffcdcec444'::uuid,'a','Casos aprovados e recusados, tratando entradas inválidas como recusadas.'),
    ('e92f6ccc-31d0-41b9-8c2f-d2ffcdcec444'::uuid,'c','Resultados de negócio e erros técnicos, sem distinguir ausência de dados.'),
    ('e92f6ccc-31d0-41b9-8c2f-d2ffcdcec444'::uuid,'d','Somente estados que podem ser representados por verdadeiro ou falso.'),
    ('2c86b622-58d9-4ecc-b4c6-9fc2b193eb29'::uuid,'b','Calcular a média de duas notas conhecidas.'),
    ('2c86b622-58d9-4ecc-b4c6-9fc2b193eb29'::uuid,'c','Validar um único CPF recebido.'),
    ('2c86b622-58d9-4ecc-b4c6-9fc2b193eb29'::uuid,'d','Escolher uma faixa de desconto para um único pedido.'),
    ('79568f28-5163-40f3-b175-331ffa044453'::uuid,'a','Um contador incrementado uma vez para cada preço lido.'),
    ('79568f28-5163-40f3-b175-331ffa044453'::uuid,'c','Uma variável substituída pelo preço atual em cada ciclo.'),
    ('79568f28-5163-40f3-b175-331ffa044453'::uuid,'d','Um acumulador reinicializado quando o próximo item é lido.'),
    ('65f5df79-29bb-4ed6-a0bf-e345b559668d'::uuid,'b','Uma variável de controle lida na condição, mesmo que não seja atualizada no corpo.'),
    ('65f5df79-29bb-4ed6-a0bf-e345b559668d'::uuid,'c','Uma condição baseada apenas em um valor constante do início ao fim.'),
    ('65f5df79-29bb-4ed6-a0bf-e345b559668d'::uuid,'d','Uma condição recalculada a partir de dados que permanecem iguais.'),
    ('d3e3b810-1e11-49e3-bd20-da40d494621d'::uuid,'b','A coleção completa, para que cada ciclo possa reprocessá-la.'),
    ('d3e3b810-1e11-49e3-bd20-da40d494621d'::uuid,'c','A posição do próximo elemento, independentemente do tipo de percurso.'),
    ('d3e3b810-1e11-49e3-bd20-da40d494621d'::uuid,'d','A quantidade de elementos restantes na coleção.'),
    ('2ccbab30-d63f-4c28-b229-09d73b626971'::uuid,'b','Imprimir disponibiliza o valor ao chamador, enquanto retornar só mostra na tela.'),
    ('2ccbab30-d63f-4c28-b229-09d73b626971'::uuid,'c','Retornar serve apenas para encerrar a função, sem transportar valor.'),
    ('2ccbab30-d63f-4c28-b229-09d73b626971'::uuid,'d','A diferença só aparece quando a função recebe mais de um parâmetro.'),
    ('84723a8d-3872-4b34-91f2-f004ea600f72'::uuid,'b','Uma taxa única usada em todos os cálculos.'),
    ('84723a8d-3872-4b34-91f2-f004ea600f72'::uuid,'c','Uma regra booleana com apenas dois resultados possíveis.'),
    ('84723a8d-3872-4b34-91f2-f004ea600f72'::uuid,'d','Um valor de limite reutilizado por várias funções.'),
    ('86096ba5-91dd-4d28-9db0-1c19e9e9ed30'::uuid,'a','Buscar o primeiro cliente ativo e encerrar o percurso.'),
    ('86096ba5-91dd-4d28-9db0-1c19e9e9ed30'::uuid,'c','Transformar cada cliente em um booleano ativo/inativo.'),
    ('86096ba5-91dd-4d28-9db0-1c19e9e9ed30'::uuid,'d','Percorrer a coleção e alterar todos os status antes de selecionar.')
), rebuilt as (
  select q.id,
         jsonb_agg(
           case when r.option_id is not null
             then jsonb_set(e.value,'{label}',to_jsonb(r.new_label))
             else e.value end
           order by e.ordinality
         ) as options
  from nexora.questions q
  cross join lateral jsonb_array_elements(q.options) with ordinality e(value,ordinality)
  left join replacements r on r.question_id=q.id and r.option_id=e.value->>'id'
  where q.id in (select distinct question_id from replacements)
  group by q.id
)
update nexora.questions q
set options=rebuilt.options
from rebuilt
where q.id=rebuilt.id;
