
(()=> {
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const state={complete:false};
  const complete=(detail={})=>{state.complete=true;window.dispatchEvent(new CustomEvent('lc:lab-complete',{detail}));};

  function frame(title,kind,body){
    return '<section class="v3-lab"><div class="v3-lab-head"><div><span>LABORATÓRIO NA AULA</span><strong>'+esc(title)+'</strong></div><span>'+esc(kind.toUpperCase())+'</span></div><div class="v3-lab-body">'+body+'</div></section>';
  }
  function feedback(el,ok,msg){el.className='v3-feedback '+(ok?'ok':'bad');el.textContent=msg}
  function bank(module){
    const t=(module||'').toLowerCase();
    if(t.includes('fundamentos'))return {q:'Qual atitude torna o uso de IA generativa mais confiável?',opts:['Aceitar a primeira resposta','Definir tarefa, contexto e validar fatos','Pedir uma resposta mais longa','Evitar informar restrições'],a:1,ok:'Correto. IA generativa é mais útil quando a tarefa é bem definida e a saída é validada.'};
    if(t.includes('prompt'))return {q:'Qual elemento reduz melhor a chance de a IA inventar dados ausentes?',opts:['Adicionar “seja profissional”','Pedir criatividade máxima','Definir fonte de verdade e comportamento para dados ausentes','Aumentar o tamanho do prompt'],a:2,ok:'Correto. Dizer de onde os fatos podem vir e o que fazer quando faltam dados controla melhor a saída.'};
    if(t.includes('pesquisa'))return {q:'Uma resposta da IA apresenta um número atual. Qual é o próximo passo correto?',opts:['Usar porque a frase parece segura','Pedir “tem certeza?”','Verificar em fonte confiável e atual','Trocar o tom da resposta'],a:2,ok:'Correto. Fluência não substitui evidência.'};
    if(t.includes('texto'))return {q:'Ao adaptar a mesma informação para WhatsApp e e-mail, o que deve permanecer estável?',opts:['Os fatos autorizados','O tamanho do texto','A saudação','A quantidade de emojis'],a:0,ok:'Correto. Canal e estilo podem mudar; os fatos não.'};
    if(t.includes('dados')||t.includes('planilha'))return {q:'Antes de aceitar um insight sugerido por IA sobre uma planilha, você deve:',opts:['Confirmar a métrica na própria base','Pedir mais três insights','Formatar o gráfico','Ocultar linhas canceladas'],a:0,ok:'Correto. O insight precisa ser rastreável até os dados.'};
    if(t.includes('imagem'))return {q:'Qual briefing tende a gerar resultado visual mais controlável?',opts:['“Faça uma imagem bonita”','Objetivo, formato, assunto, composição, luz e restrições','Somente uma lista de adjetivos','Pedir várias mudanças ao mesmo tempo'],a:1,ok:'Correto. Um briefing observável é mais útil que adjetivos vagos.'};
    if(t.includes('automação'))return {q:'Qual etapa deve tratar uma saída de IA fora do schema esperado?',opts:['Validação/fallback','Gatilho','Interface visual','Marketing'],a:0,ok:'Correto. Saídas estruturadas precisam ser validadas antes da próxima ação.'};
    if(t.includes('agentes'))return {q:'Uma ação crítica de um agente deve:',opts:['Ser executada sem limite','Ter confirmação/política e registro','Ignorar argumentos inválidos','Usar a ferramenta mais cara'],a:1,ok:'Correto. Ações críticas precisam de limites, validação e auditabilidade.'};
    if(t.includes('rag'))return {q:'Se a base RAG não contém evidência para uma pergunta, a resposta correta é:',opts:['Inventar a opção mais provável','Usar memória do modelo sem avisar','Declarar ausência de evidência','Citar um chunk aleatório'],a:2,ok:'Correto. Um RAG confiável sabe quando não há evidência.'};
    if(t.includes('governança'))return {q:'Qual dado merece maior restrição ao usar IA?',opts:['Texto público do site','Senha ou segredo de API','Título de um curso','Nome de uma cor'],a:1,ok:'Correto. Segredos e dados sensíveis não devem ser expostos indevidamente.'};
    if(t.includes('lógica'))return {q:'Antes de escrever código para um problema, qual sequência é mais segura?',opts:['Código → requisito → teste','Problema → entradas/saídas → pseudocódigo → teste','Interface → cor → código','Deploy → teste → regra'],a:1,ok:'Correto. Modelar e testar a lógica antes do código reduz retrabalho.'};
    if(t.includes('web'))return {q:'Qual escolha melhora semântica e acessibilidade?',opts:['Usar div para tudo','Usar elementos adequados e labels em controles','Remover foco do teclado','Fixar toda largura em pixels'],a:1,ok:'Correto. Semântica e associação de labels melhoram compreensão e acessibilidade.'};
    if(t.includes('javascript'))return {q:'Em uma interface baseada em estado, o DOM deve:',opts:['Ser a única fonte de verdade','Refletir o estado da aplicação','Ser reescrito manualmente sem dados','Ignorar eventos'],a:1,ok:'Correto. O estado representa os dados e a renderização reflete esse estado.'};
    if(t.includes('git'))return {q:'Qual sequência cria um commit local?',opts:['git add → git commit','git push → git init','git clone → npm start','git merge → git pull'],a:0,ok:'Correto. Primeiro você prepara as alterações, depois cria o commit.'};
    if(t.includes('typescript'))return {q:'Em TypeScript estrito, qual prática é preferível?',opts:['Usar any em tudo','Modelar tipos e tratar unknown antes de usar','Desativar strict','Ignorar erros do compilador'],a:1,ok:'Correto. Tipos explícitos e narrowing tornam erros visíveis antes da execução.'};
    if(t.includes('react'))return {q:'Um valor que pode ser calculado diretamente a partir do estado deve, em geral:',opts:['Virar outro estado sincronizado por effect','Ser derivado durante a renderização','Ser salvo em variável global','Ser colocado no localStorage sempre'],a:1,ok:'Correto. Evite estado duplicado quando o valor é derivável.'};
    if(t.includes('banco'))return {q:'Qual restrição representa uma relação entre tabelas?',opts:['FOREIGN KEY','ORDER BY','LIMIT','ALIAS'],a:0,ok:'Correto. A foreign key relaciona a chave de uma tabela a outra.'};
    if(t.includes('api'))return {q:'Uma API recebe POST sem campo obrigatório. Qual resposta é mais adequada?',opts:['200 e criar registro vazio','Erro 4xx de validação','500 sempre','Redirecionar para home'],a:1,ok:'Correto. Entrada inválida deve ser recusada com erro de cliente apropriado.'};
    if(t.includes('autenticação'))return {q:'Autenticação e autorização são, respectivamente:',opts:['Permissão e identidade','Identidade e permissão','Banco e frontend','Senha e CSS'],a:1,ok:'Correto. Primeiro identificamos quem é; depois verificamos o que pode fazer.'};
    if(t.includes('full stack'))return {q:'Antes de ligar o frontend a um endpoint, é útil:',opts:['Testar o contrato da API isoladamente','Remover validação','Desabilitar erros','Ignorar o banco'],a:0,ok:'Correto. Testar a API isoladamente reduz a área de diagnóstico.'};
    if(t.includes('testes'))return {q:'Um teste de qualidade útil deve incluir:',opts:['Somente o caso feliz','Caso normal, limites e erros','Apenas screenshots','Somente opinião do desenvolvedor'],a:1,ok:'Correto. Casos de borda e falhas revelam problemas que o fluxo normal não mostra.'};
    if(t.includes('cloudflare'))return {q:'Onde deve ficar uma API key usada por um Worker?',opts:['No repositório público','Em secret/variável segura do ambiente','No HTML','No README'],a:1,ok:'Correto. Segredos não devem ser versionados no frontend ou repositório.'};
    if(t.includes('saas'))return {q:'Um MVP saudável começa por:',opts:['Adicionar muitas features','Problema, usuário e fluxo principal mensurável','Escolher animações','Criar planos de preço antes do produto'],a:1,ok:'Correto. MVP reduz escopo para validar valor, não para acumular funcionalidades.'};
    return {q:'Qual comportamento demonstra melhor aprendizagem prática?',opts:['Executar, conferir e corrigir','Copiar sem testar','Pular a validação','Aceitar qualquer resultado'],a:0,ok:'Correto. Execução e validação tornam a aprendizagem observável.'};
  }

  function lessonCheck(module,cp){
    if(cp&&cp.question&&Array.isArray(cp.options)&&cp.options.length>=2){
      const len=cp.options.length,seed=[...cp.question].reduce((s,ch)=>s+ch.charCodeAt(0),0),shift=seed%len;
      const opts=cp.options.slice(shift).concat(cp.options.slice(0,shift));
      const original=Number(cp.answer||0),a=(original-shift+len)%len;
      return {q:cp.question,opts,a,ok:cp.feedback||'Correto. Você identificou o conceito ensinado nesta microaula.'};
    }
    return bank(module);
  }
  function mcq(module,cp,title='Checkpoint rápido'){
    const b=lessonCheck(module,cp);
    return frame(title,'múltipla escolha',
      '<p class="v3-lab-instructions">'+esc(b.q)+'</p><div class="v3-mcq" data-mcq>'+
      b.opts.map((o,i)=>'<label class="v3-option"><input type="radio" name="v3q" value="'+i+'"><span><b>'+String.fromCharCode(65+i)+'.</b> '+esc(o)+'</span></label>').join('')+
      '</div><div class="v3-toolbar"><button class="v3-btn" type="button" data-check>Verificar resposta</button></div><div class="v3-feedback" data-feedback>Escolha uma alternativa.</div>'
    );
  }
  function wireMcq(root,module,cp){
    const b=lessonCheck(module,cp),btn=root.querySelector('[data-check]'),fb=root.querySelector('[data-feedback]');
    root.querySelectorAll('.v3-option').forEach(x=>x.onclick=()=>{root.querySelectorAll('.v3-option').forEach(y=>y.classList.remove('selected'));x.classList.add('selected')});
    btn.onclick=()=>{const x=root.querySelector('input[name=v3q]:checked');if(!x)return feedback(fb,false,'Escolha uma alternativa antes de verificar.');const ok=Number(x.value)===b.a;root.querySelectorAll('.v3-option').forEach((o,i)=>{o.classList.toggle('correct',i===b.a);o.classList.toggle('wrong',i===Number(x.value)&&!ok)});feedback(fb,ok,ok?b.ok:'Ainda não. Observe o procedimento demonstrado na microaula e tente novamente.');if(ok){btn.disabled=true;complete({type:'mcq'})}};
  }

  function logicLab(){
    const steps=[
      ['entrada','1. Definir entradas','Quais dados o algoritmo recebe?'],
      ['regra','2. Aplicar a regra','Que transformação ou condição precisa acontecer?'],
      ['saida','3. Definir a saída','Qual resultado deve ser observável?'],
      ['teste','4. Testar o limite','Qual caso de fronteira prova que a regra está correta?']
    ];
    const mixed=[steps[2],steps[0],steps[3],steps[1]];
    return frame('Algorithm Builder','lógica','<p class="v3-lab-instructions">Monte um algoritmo na ordem correta. O objetivo não é decorar código: é organizar entrada, regra, saída e teste.</p><div class="nx-flow-pool" data-logic-pool>'+mixed.map(s=>'<button type="button" class="v3-option nx-flow-step" data-logic="'+s[0]+'"><span><b>'+esc(s[1])+'</b><small>'+esc(s[2])+'</small></span></button>').join('')+'</div><div class="nx-flow-built" data-logic-built><span class="muted">Seu algoritmo aparecerá aqui.</span></div><div class="v3-toolbar"><button type="button" class="v3-btn" data-logic-check>Validar algoritmo</button><button type="button" class="v3-btn secondary" data-logic-reset>Recomeçar</button></div><div class="v3-feedback" data-feedback>Sequência esperada: primeiro entenda os dados, depois a regra, o resultado e o teste.</div>');
  }
  function wireLogic(root){
    const expected=['entrada','regra','saida','teste'],chosen=[],built=root.querySelector('[data-logic-built]'),fb=root.querySelector('[data-feedback]');
    const paint=()=>{built.innerHTML=chosen.length?chosen.map((x,i)=>'<span class="v3-pill">'+(i+1)+' · '+esc(x)+'</span>').join('<span class="nx-flow-arrow">→</span>'):'<span class="muted">Seu algoritmo aparecerá aqui.</span>'};
    root.querySelectorAll('[data-logic]').forEach(b=>b.onclick=()=>{if(chosen.includes(b.dataset.logic))return;chosen.push(b.dataset.logic);b.disabled=true;paint()});
    root.querySelector('[data-logic-reset]').onclick=()=>{chosen.splice(0);root.querySelectorAll('[data-logic]').forEach(b=>b.disabled=false);paint();feedback(fb,false,'Recomece pela pergunta: quais dados entram?')};
    root.querySelector('[data-logic-check]').onclick=()=>{const ok=chosen.length===4&&chosen.every((x,i)=>x===expected[i]);feedback(fb,ok,ok?'Algoritmo bem estruturado: entrada → regra → saída → teste.':'Ainda não. Uma solução verificável começa definindo entrada e termina testando o resultado.');if(ok)complete({type:'logic'})};
  }

  function pseudocodeLab(){
    const blocks=[
      ['ler','LER valor_pedido'],
      ['decidir','SE valor_pedido >= 200 ENTÃO'],
      ['sim','    frete ← 0'],
      ['senao','SENÃO'],
      ['nao','    frete ← 20'],
      ['mostrar','MOSTRAR frete']
    ],mixed=[blocks[3],blocks[0],blocks[5],blocks[1],blocks[4],blocks[2]];
    return frame('Pseudocódigo Builder','pseudocódigo','<p class="v3-lab-instructions">Ordene os blocos para representar a regra: pedidos de R$ 200 ou mais têm frete grátis; abaixo disso, frete de R$ 20.</p><div class="nx-flow-pool" data-pseudo-pool>'+mixed.map(x=>'<button type="button" class="v3-option nx-flow-step" data-pseudo="'+x[0]+'"><code>'+esc(x[1])+'</code></button>').join('')+'</div><pre class="v3-console" data-pseudo-built>Seu pseudocódigo aparecerá aqui.</pre><div class="v3-toolbar"><button type="button" class="v3-btn" data-pseudo-check>Validar</button><button type="button" class="v3-btn secondary" data-pseudo-reset>Recomeçar</button></div><div class="v3-feedback" data-feedback>Leia a entrada antes de testar a condição e mostre a saída apenas depois de definir o frete.</div>');
  }
  function wirePseudocode(root){
    const expected=['ler','decidir','sim','senao','nao','mostrar'],chosen=[],pre=root.querySelector('[data-pseudo-built]'),fb=root.querySelector('[data-feedback]');
    const labels={ler:'LER valor_pedido',decidir:'SE valor_pedido >= 200 ENTÃO',sim:'    frete ← 0',senao:'SENÃO',nao:'    frete ← 20',mostrar:'MOSTRAR frete'};
    const paint=()=>pre.textContent=chosen.length?chosen.map(x=>labels[x]).join('\n'):'Seu pseudocódigo aparecerá aqui.';
    root.querySelectorAll('[data-pseudo]').forEach(b=>b.onclick=()=>{if(chosen.includes(b.dataset.pseudo))return;chosen.push(b.dataset.pseudo);b.disabled=true;paint()});
    root.querySelector('[data-pseudo-reset]').onclick=()=>{chosen.splice(0);root.querySelectorAll('[data-pseudo]').forEach(b=>b.disabled=false);paint();feedback(fb,false,'Pseudocódigo limpo. Comece por LER o valor.')};
    root.querySelector('[data-pseudo-check]').onclick=()=>{const ok=chosen.length===expected.length&&chosen.every((x,i)=>x===expected[i]);feedback(fb,ok,ok?'Fluxo correto. Você preservou leitura, decisão, dois ramos e saída.':'Ainda não. Revise a ordem: LER → SE → caminho verdadeiro → SENÃO → caminho falso → MOSTRAR.');if(ok)complete({type:'pseudocode'})};
  }
  function promptLab(module){
    const base= module.toLowerCase().includes('imagem')
      ? 'Crie uma imagem para divulgar um workshop.'
      : module.toLowerCase().includes('texto')
      ? 'Escreva uma mensagem para um cliente.'
      : 'Transforme as informações abaixo em um resultado profissional.';
    const sample='Contexto de teste:\nCliente: Empresa Aurora\nObjetivo: organizar próximos passos\nFatos: reunião na sexta; orçamento ainda não definido; Ana revisará a apresentação.';
    return frame('Prompt Lab','prompt',
      '<p class="v3-lab-instructions">Melhore o prompt dentro da própria aula. Não é redação: você está construindo uma instrução executável. O laboratório verifica quatro elementos essenciais.</p>'+
      '<div class="v3-code-tabs"><button class="active" type="button">PROMPT</button><button type="button">DADOS DE TESTE</button></div>'+
      '<textarea class="v3-editor" data-prompt>'+esc(base)+'</textarea>'+
      '<pre class="v3-console" data-input>'+esc(sample)+'</pre>'+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-analyze>Analisar prompt</button><button class="v3-btn secondary" type="button" data-example>Inserir estrutura recomendada</button></div>'+
      '<div class="v3-feedback" data-feedback>Meta: incluir objetivo, contexto/fonte, restrições e formato de saída.</div>'+
      '<div class="v3-mcq" style="margin-top:12px"><div class="v3-option"><span>✓ O prompt será considerado concluído com pelo menos 3 de 4 critérios explícitos.</span></div></div>'
    );
  }
  function wirePrompt(root,module){
    const ed=root.querySelector('[data-prompt]'),fb=root.querySelector('[data-feedback]');
    root.querySelector('[data-example]').onclick=()=>{ed.value='Objetivo: transforme somente os fatos fornecidos em um plano de ação.\nContexto/Fonte: use apenas os dados abaixo como fonte de verdade.\nRestrições: não invente preço, prazo ou responsável; quando faltar dado, escreva NÃO INFORMADO.\nFormato: tabela com Tarefa | Responsável | Prazo | Evidência.'};
    root.querySelector('[data-analyze]').onclick=()=>{
      const s=ed.value.toLowerCase();
      const checks=[
        /objetivo|resultado|produza|transforme/.test(s),
        /contexto|fonte|dados|informações/.test(s),
        /não |restri|evite|nunca|ausente/.test(s),
        /formato|tabela|json|lista|coluna/.test(s)
      ];
      const score=checks.filter(Boolean).length;
      feedback(fb,score>=3,'Critérios encontrados: '+score+'/4. '+(score>=3?'Boa estrutura. Agora compare se a saída esperada pode ser validada objetivamente.':'Inclua explicitamente o que deve sair, de onde vêm os fatos, limites e formato.'));
      if(score>=3)complete({type:'prompt',score});
    };
  }

  function spreadsheetLab(){
    const rows=[
      ['Mouse',2,120,'Concluída',240],
      ['Monitor',1,800,'Concluída',800],
      ['Teclado',3,200,'Cancelada',0],
      ['Headset',2,180,'Concluída',360],
      ['Webcam',1,320,'Pendente',0]
    ];
    return frame('Mini Planilha — vendas','planilha',
      '<p class="v3-lab-instructions">Preencha a coluna Receita. Considere receita somente quando Status = Concluída. Você pode digitar o resultado numérico; a validação acontece na própria aula.</p>'+
      '<div class="v3-sheet-wrap"><table class="v3-sheet"><thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Status</th><th>Receita</th></tr></thead><tbody>'+
      rows.map((r,i)=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>R$ '+r[2].toFixed(2)+'</td><td>'+r[3]+'</td><td><input inputmode="decimal" data-sheet="'+i+'" placeholder="0,00"></td></tr>').join('')+
      '</tbody></table></div>'+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-validate>Validar planilha</button><button class="v3-btn secondary" type="button" data-formula>Ver fórmula-modelo</button></div>'+
      '<div class="v3-feedback" data-feedback>Resultado esperado: vendas canceladas ou pendentes não entram na receita.</div>'+
      '<pre class="v3-console" data-formula-box style="display:none">Excel/Sheets: =SE(D2="Concluída";B2*C2;0)\nA lógica é: se a venda estiver concluída, Quantidade × Preço; caso contrário, zero.</pre>'
    );
  }
  function wireSheet(root){
    const expected=[240,800,0,360,0],fb=root.querySelector('[data-feedback]');
    root.querySelector('[data-formula]').onclick=()=>{const b=root.querySelector('[data-formula-box]');b.style.display=b.style.display==='none'?'block':'none'};
    root.querySelector('[data-validate]').onclick=()=>{
      let okn=0;
      root.querySelectorAll('[data-sheet]').forEach((inp,i)=>{const v=Number(String(inp.value).replace('.','').replace(',','.'))||0;const ok=Math.abs(v-expected[i])<.01;inp.closest('td').className=ok?'cell-ok':'cell-bad';if(ok)okn++});
      const ok=okn===expected.length;feedback(fb,ok,ok?'5/5 corretas. Você aplicou a regra de status antes de somar a receita.':okn+'/5 corretas. Revise as linhas destacadas.');if(ok)complete({type:'spreadsheet'});
    };
  }

  function javascriptLab(kind='javascript'){
    const starter=kind==='typescript'
      ? 'type Produto = { nome: string; preco: number };\nconst produtos: Produto[] = [{nome:"Mouse",preco:120},{nome:"Monitor",preco:800}];\nconst caros = produtos.filter(p => p.preco > 500);\nconsole.log(caros);'
      : 'const produtos = [{nome:"Mouse",preco:120},{nome:"Monitor",preco:800}];\nconst caros = produtos.filter(p => p.preco > 500);\nconsole.log(caros);';
    return frame(kind==='typescript'?'TypeScript Lab':'Console JavaScript',kind,
      '<p class="v3-lab-instructions">'+(kind==='typescript'?'Edite o exemplo e use o verificador de tipos conceitual. A execução usa JavaScript equivalente no navegador.':'Edite e execute o código sem sair da LC. O console aparece logo abaixo.')+'</p>'+
      '<textarea class="v3-editor" data-code>'+esc(starter)+'</textarea>'+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-run>▶ Executar</button>'+(kind==='typescript'?'<button class="v3-btn secondary" type="button" data-typecheck>Verificar tipos</button>':'')+'</div>'+
      '<pre class="v3-console" data-console>Pronto para executar.</pre>'
    );
  }
  function wireJs(root,kind){
    const ed=root.querySelector('[data-code]'),out=root.querySelector('[data-console]');
    const run=()=>{
      const iframe=document.createElement('iframe');iframe.sandbox='allow-scripts';iframe.src='../lab-runner.html';iframe.hidden=true;document.body.appendChild(iframe);
      const requestId=crypto.randomUUID();
      const code=kind==='typescript'?ed.value.replace(/type\s+\w+\s*=\s*\{[^}]*\};?/gs,'').replace(/:\s*\w+(\[\])?/g,''):ed.value;
      let finished=false;
      const cleanup=()=>{window.removeEventListener('message',listener);iframe.remove()};
      const listener=e=>{if(e.source!==iframe.contentWindow||e.data?.type!=='lc-lab-result'||e.data?.requestId!==requestId)return;finished=true;out.textContent=e.data.output;cleanup();if(e.data.ok)complete({type:kind})};
      window.addEventListener('message',listener);
      iframe.addEventListener('load',()=>iframe.contentWindow.postMessage({type:'lc-lab-run',requestId,code},'*'),{once:true});
      setTimeout(()=>{if(!finished&&iframe.isConnected){out.textContent='Execução interrompida por limite de tempo.';cleanup()}},1800);
    };
    root.querySelector('[data-run]').onclick=run;
    const tc=root.querySelector('[data-typecheck]');if(tc)tc.onclick=()=>{const good=/type |interface /.test(ed.value)&&!/:\s*any\b/.test(ed.value);out.textContent=good?'✓ Há modelagem explícita e nenhum any evidente.':'Revise: declare um type/interface e evite any quando possível.';if(good)complete({type:'typescript'})};
  }

  function pythonLab(ctx={}){
    const t=(ctx.lesson?.title||'').toLowerCase();
    let starter="nome = 'LC'\nprint(nome)";
    if(t.includes('número')||t.includes('operador'))starter='preco = 120\nquantidade = 2\ntotal = preco * quantidade\nprint(total)';
    else if(t.includes('compar')||t==='if'||t.includes('else')||t.includes('elif'))starter="nota = 7\nif nota >= 7:\n    print('Aprovado')\nelse:\n    print('Recuperação')";
    else if(t.includes('for'))starter='for i in range(1, 6):\n    print(i)';
    else if(t.includes('while'))starter='tentativas = 0\nwhile tentativas < 3:\n    print(tentativas)\n    tentativas = tentativas + 1';
    else if(t.includes('lista')||t.includes('percorrendo'))starter='notas = [8, 7, 9]\nprint(sum(notas))\nprint(len(notas))';
    else if(t.includes('funç')||t.includes('return'))starter='def dobro(n):\n    return n * 2\nprint(dobro(5))';
    else if(t.includes('vendas')||t.includes('projeto'))starter='vendas = [120, 850, 300]\ntotal = sum(vendas)\nmedia = total / len(vendas)\nprint(total)\nprint(media)';
    return frame('Python Lab — fundamentos','python','<p class="v3-lab-instructions">Edite o código e execute no simulador introdutório da LC. Ele cobre variáveis, operações, listas, len, sum, if/else e range suficientes para as primeiras práticas, sem sair da aula.</p><textarea class="v3-editor" data-python>'+esc(starter)+'</textarea><div class="v3-toolbar"><button class="v3-btn" type="button" data-python-run>▶ Executar</button><button class="v3-btn secondary" type="button" data-python-reset>Restaurar</button></div><pre class="v3-console" data-python-out>Python Lab pronto.</pre>');
  }
  function pythonExpr(s,env){
    let x=String(s).trim();
    if(/^[-+]?\d+(?:\.\d+)?$/.test(x))return Number(x);
    if(/^(['"]).*\1$/.test(x))return x.slice(1,-1);
    if(/^\[.*\]$/.test(x)){const body=x.slice(1,-1).trim();return body?body.split(',').map(v=>pythonExpr(v,env)):[]}
    let m=x.match(/^len\((\w+)\)$/);if(m)return (env[m[1]]||[]).length;
    m=x.match(/^sum\((\w+)\)$/);if(m)return (env[m[1]]||[]).reduce((a,b)=>a+Number(b),0);
    m=x.match(/^(\w+)\s*([+*\/-])\s*(\w+|[-+]?\d+(?:\.\d+)?)$/);if(m){const a=m[1] in env?env[m[1]]:Number(m[1]),b=m[3] in env?env[m[3]]:Number(m[3]);if(m[2]==='+')return a+b;if(m[2]==='-')return a-b;if(m[2]==='*')return a*b;if(m[2]==='/')return a/b}
    if(x in env)return env[x];
    return x;
  }
  function simulatePython(src){
    const env={},out=[],lines=String(src||'').replace(/\t/g,'    ').split(/\r?\n/);
    for(let i=0;i<lines.length;i++){const raw=lines[i],s=raw.trim();if(!s||s.startsWith('#'))continue;let m;
      if((m=s.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/))&&!s.startsWith('if ')){env[m[1]]=pythonExpr(m[2],env);continue}
      if((m=s.match(/^print\((.*)\)$/))){out.push(String(pythonExpr(m[1],env)));continue}
      if((m=s.match(/^for\s+(\w+)\s+in\s+range\((\d+)\s*,\s*(\d+)\):$/))){const next=(lines[i+1]||'').trim(),pm=next.match(/^print\((.*)\)$/);if(!pm)throw new Error('Neste simulador, use print() dentro do exemplo de for.');for(let n=Number(m[2]);n<Number(m[3]);n++){env[m[1]]=n;out.push(String(pythonExpr(pm[1],env)))}i++;continue}
      if((m=s.match(/^if\s+([A-Za-z_]\w*)\s*(>=|<=|==|>|<)\s*([-+]?\d+(?:\.\d+)?):$/))){const a=Number(env[m[1]]),b=Number(m[3]);const ok=m[2]==='>='?a>=b:m[2]==='<='?a<=b:m[2]==='>'?a>b:m[2]==='<'?a<b:a===b;const yes=(lines[i+1]||'').trim().match(/^print\((.*)\)$/);let no=null;if((lines[i+2]||'').trim()==='else:')no=(lines[i+3]||'').trim().match(/^print\((.*)\)$/);if(ok&&yes)out.push(String(pythonExpr(yes[1],env)));else if(!ok&&no)out.push(String(pythonExpr(no[1],env)));i+=no?3:1;continue}
      if(/^def\s+/.test(s)||/^return\s+/.test(s)||/^while\s+/.test(s)||/^try:/.test(s)||/^except\s+/.test(s)){out.push('✓ Estrutura reconhecida pelo simulador didático: '+s);continue}
      throw new Error('Linha ainda não suportada pelo simulador introdutório: '+s);
    }
    return out.join('\n')||'Código processado sem saída.';
  }
  function wirePython(root){const ed=root.querySelector('[data-python]'),out=root.querySelector('[data-python-out]'),original=ed.value;root.querySelector('[data-python-reset]').onclick=()=>{ed.value=original;out.textContent='Exemplo restaurado.'};root.querySelector('[data-python-run]').onclick=()=>{try{out.textContent=simulatePython(ed.value);complete({type:'python'})}catch(e){out.textContent='Erro: '+e.message}}}
  function htmlLab(){
    const starter='<main>\\n  <h1>Minha primeira página</h1>\\n  <button id="acao">Testar</button>\\n</main>\\n<style>body{font-family:Arial;padding:24px}button{padding:10px 16px}</style>\\n<script>document.querySelector("#acao").onclick=()=>document.querySelector("h1").textContent="Funcionou!"<\\/script>';
    return frame('Web Lab — HTML/CSS/JS','preview',
      '<p class="v3-lab-instructions">Edite a página e veja o resultado dentro da aula. O preview roda em um iframe isolado.</p><textarea class="v3-editor" data-html>'+esc(starter)+'</textarea><div class="v3-toolbar"><button class="v3-btn" type="button" data-preview>Atualizar preview</button></div><iframe class="v3-preview" sandbox="allow-scripts" data-preview-frame></iframe>'
    );
  }
  function wireHtml(root){root.querySelector('[data-preview]').onclick=()=>{root.querySelector('[data-preview-frame]').srcdoc=root.querySelector('[data-html]').value;complete({type:'html'})};}


  function reactLab(){
    const starter='function CursoCard({curso}) {\\n  return <article><h3>{curso.nome}</h3><button>Favoritar</button></article>;\\n}\\n\\nconst cursos = [{id:1,nome:"JavaScript"},{id:2,nome:"React"}];\\n\\nfunction App(){\\n  const [busca,setBusca] = useState("");\\n  const filtrados = cursos.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));\\n  return <main>{filtrados.map(c => <CursoCard key={c.id} curso={c} />)}</main>;\\n}';
    return frame('React Lab — componentes e estado','react',
      '<p class="v3-lab-instructions">Edite o exemplo sem sair da aula. O validador procura quatro competências: componente, props, estado e lista com key estável. A prévia abaixo representa o resultado esperado.</p>'+
      '<textarea class="v3-editor" data-react>'+esc(starter)+'</textarea>'+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-react-check>Validar JSX</button><button class="v3-btn secondary" type="button" data-react-preview>Atualizar prévia</button></div>'+
      '<div class="v3-feedback" data-feedback>Meta: 4/4 critérios encontrados.</div>'+
      '<div class="v3-preview" data-react-frame style="padding:18px;color:#172235;font-family:Arial;min-height:150px"><h3 style="margin-top:0">Catálogo</h3><div style="display:flex;gap:10px;flex-wrap:wrap"><div style="border:1px solid #ccd7e2;border-radius:10px;padding:12px">JavaScript <button>Favoritar</button></div><div style="border:1px solid #ccd7e2;border-radius:10px;padding:12px">React <button>Favoritar</button></div></div></div>'
    );
  }
  function wireReact(root){
    const ed=root.querySelector('[data-react]'),fb=root.querySelector('[data-feedback]'),preview=root.querySelector('[data-react-frame]');
    root.querySelector('[data-react-check]').onclick=()=>{
      const s=ed.value;
      const checks=[
        /function\s+[A-Z]\w*\s*\(/.test(s)||/const\s+[A-Z]\w*\s*=/.test(s),
        /\{\s*curso\s*\}|props/.test(s),
        /useState\s*\(/.test(s),
        /\.map\s*\(/.test(s)&&/key\s*=/.test(s)
      ];
      const score=checks.filter(Boolean).length;
      feedback(fb,score===4,score===4?'4/4 critérios encontrados. O exemplo demonstra componente, props, estado e renderização de lista com key.':score+'/4 critérios encontrados. Revise componente, props, useState e map com key estável.');
      if(score===4)complete({type:'react'});
    };
    root.querySelector('[data-react-preview]').onclick=()=>{
      const names=[...ed.value.matchAll(/nome\s*:\s*["']([^"']+)["']/g)].map(m=>m[1]).slice(0,6);
      const list=names.length?names:['JavaScript','React'];
      preview.innerHTML='<h3 style="margin-top:0">Prévia didática</h3><div style="display:flex;gap:10px;flex-wrap:wrap">'+list.map(n=>'<div style="border:1px solid #ccd7e2;border-radius:10px;padding:12px">'+esc(n)+' <button>Favoritar</button></div>').join('')+'</div>';
    };
  }

  function sqlLab(){
    const data=[{id:1,produto:'Mouse',valor:120},{id:2,produto:'Monitor',valor:800},{id:3,produto:'Teclado',valor:250},{id:4,produto:'Cadeira',valor:950}];
    return frame('SQL Lab — consulta local','sql',
      '<p class="v3-lab-instructions">Consulte a tabela <b>vendas</b>. O simulador suporta SELECT * FROM vendas e uma cláusula WHERE valor &gt; número.</p>'+
      '<pre class="v3-console">vendas(id, produto, valor)\\n1 | Mouse | 120\\n2 | Monitor | 800\\n3 | Teclado | 250\\n4 | Cadeira | 950</pre>'+
      '<textarea class="v3-editor small" data-sql>SELECT * FROM vendas WHERE valor > 500;</textarea>'+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-sql-run>Executar consulta</button></div><pre class="v3-console" data-sql-out></pre>'
    );
  }
  function wireSql(root){
    const data=[{id:1,produto:'Mouse',valor:120},{id:2,produto:'Monitor',valor:800},{id:3,produto:'Teclado',valor:250},{id:4,produto:'Cadeira',valor:950}],out=root.querySelector('[data-sql-out]');
    root.querySelector('[data-sql-run]').onclick=()=>{const q=root.querySelector('[data-sql]').value.trim();if(!/^select\s+\*\s+from\s+vendas/i.test(q)){out.textContent='Neste laboratório, comece com SELECT * FROM vendas.';return}let rows=data;const m=q.match(/where\s+valor\s*>\s*(\d+(?:\.\d+)?)/i);if(m)rows=rows.filter(x=>x.valor>Number(m[1]));out.textContent=JSON.stringify(rows,null,2);complete({type:'sql'})};
  }

  function terminalLab(module){
    const low=module.toLowerCase(),cloud=low.includes('cloudflare'),basic=low.includes('terminal sem medo');
    const steps=cloud?['npx wrangler --version','npx wrangler dev','npx wrangler deploy']:basic?['pwd','ls','mkdir projeto','cd projeto']:['git status','git add .','git commit -m "feat: minha alteração"','git push'];
    return frame(cloud?'Terminal Cloudflare':basic?'Terminal Básico':'Terminal Git','terminal',
      '<p class="v3-lab-instructions">Digite os comandos no terminal simulado. Nada é executado no seu computador; o objetivo é aprender sequência, sintaxe e interpretação da saída.</p><pre class="v3-console" data-term-out>$ ambiente LC pronto</pre><div class="v3-api-row" style="margin-top:10px"><input data-term placeholder="'+esc(steps[0])+'"><button class="v3-btn" type="button" data-term-send>Executar</button></div><small class="muted" data-term-help style="display:block;margin-top:10px">Próximo objetivo: '+esc(steps[0])+'</small>'
    );
  }
  function wireTerminal(root,module){
    const low=module.toLowerCase(),cloud=low.includes('cloudflare'),basic=low.includes('terminal sem medo'),steps=cloud?['npx wrangler --version','npx wrangler dev','npx wrangler deploy']:basic?['pwd','ls','mkdir projeto','cd projeto']:['git status','git add .','git commit -m "feat: minha alteração"','git push'];let i=0;
    const inp=root.querySelector('[data-term]'),out=root.querySelector('[data-term-out]'),help=root.querySelector('[data-term-help]');
    root.querySelector('[data-term-send]').onclick=()=>{const cmd=inp.value.trim();if(cmd!==steps[i]){out.textContent+='\n$ '+cmd+'\nComando válido, mas a missão atual espera: '+steps[i];return}out.textContent+='\n$ '+cmd+'\n'+(cloud?(i===0?'wrangler 4.x':i===1?'Ready on http://localhost:8787':'Deployed successfully ✓'):basic?(i===0?'/home/aluno':i===1?'README.md  src/':i===2?'pasta projeto criada ✓':'diretório atual: projeto ✓'):(i===0?'working tree status exibido':i===1?'changes staged':i===2?'commit criado ✓':'push concluído ✓'));i++;inp.value='';if(i>=steps.length){help.textContent='✓ Sequência concluída.';complete({type:'terminal'})}else{help.textContent='Próximo objetivo: '+steps[i];inp.placeholder=steps[i]}};
  }

  function apiLab(){
    return frame('API Playground','http',
      '<p class="v3-lab-instructions">Envie requisições para uma API simulada da LC. Assim você pratica método, rota, status e JSON sem Postman.</p><div class="v3-api-row"><select data-method><option>GET</option><option>POST</option></select><input data-path value="/api/produtos"><button class="v3-btn" type="button" data-send>Enviar</button></div><textarea class="v3-editor small" data-body style="margin-top:10px" placeholder=\'{"nome":"Teclado","preco":250}\'></textarea><pre class="v3-console" data-api-out>HTTP aguardando requisição...</pre>'
    );
  }
  function wireApi(root){
    const out=root.querySelector('[data-api-out]');
    root.querySelector('[data-send]').onclick=()=>{const method=root.querySelector('[data-method]').value,path=root.querySelector('[data-path]').value.trim();if(path!='/api/produtos'){out.textContent='HTTP 404\\n{"error":"Rota não encontrada"}';return}if(method==='GET'){out.textContent='HTTP 200\\n'+JSON.stringify({produtos:[{id:1,nome:'Mouse',preco:120},{id:2,nome:'Monitor',preco:800}]},null,2);complete({type:'api'})}else{try{const body=JSON.parse(root.querySelector('[data-body]').value||'{}');if(!body.nome||!Number.isFinite(Number(body.preco)))throw new Error('nome e preco são obrigatórios');out.textContent='HTTP 201\\n'+JSON.stringify({id:3,...body},null,2);complete({type:'api'})}catch(e){out.textContent='HTTP 422\\n'+JSON.stringify({error:e.message},null,2)}}};
  }


  function automationLab(){
    const steps=[
      {id:'trigger',label:'1. Gatilho',desc:'O evento que inicia o fluxo.'},
      {id:'validate_in',label:'2. Validar entrada',desc:'Campos, tipos e obrigatoriedade antes da IA.'},
      {id:'rules',label:'3. Regras determinísticas',desc:'Resolva com lógica simples o que não precisa de IA.'},
      {id:'ai',label:'4. IA com saída estruturada',desc:'Use IA apenas na interpretação/geração necessária.'},
      {id:'validate_out',label:'5. Validar saída',desc:'Schema, valores permitidos e fallback.'},
      {id:'action',label:'6. Ação + log',desc:'Só execute depois da validação e registre o resultado.'}
    ];
    const scrambled=[steps[3],steps[0],steps[5],steps[1],steps[4],steps[2]];
    return frame('Flow Builder — automação confiável','automação',
      '<p class="v3-lab-instructions">Clique nos blocos na ordem em que um fluxo profissional deve executar. Você já viu cada conceito antes desta prática.</p>'+
      '<div class="nx-flow-pool" data-pool>'+scrambled.map(s=>'<button type="button" class="v3-option nx-flow-step" data-step="'+s.id+'"><span><b>'+esc(s.label)+'</b><small>'+esc(s.desc)+'</small></span></button>').join('')+'</div>'+
      '<div class="nx-flow-built" data-built><span class="muted">Seu fluxo aparecerá aqui.</span></div>'+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-flow-check>Validar fluxo</button><button class="v3-btn secondary" type="button" data-flow-reset>Recomeçar</button></div>'+
      '<div class="v3-feedback" data-feedback>Meta: nenhuma ação deve acontecer antes da validação da entrada e da saída.</div>'
    );
  }
  function wireAutomation(root){
    const expected=['trigger','validate_in','rules','ai','validate_out','action'],chosen=[],built=root.querySelector('[data-built]'),fb=root.querySelector('[data-feedback]');
    function paint(){
      built.innerHTML=chosen.length?chosen.map((id,i)=>'<span class="v3-pill">'+(i+1)+' · '+esc(id.replaceAll('_',' '))+'</span>').join('<span class="nx-flow-arrow">→</span>'):'<span class="muted">Seu fluxo aparecerá aqui.</span>';
    }
    root.querySelectorAll('[data-step]').forEach(btn=>btn.onclick=()=>{if(chosen.includes(btn.dataset.step))return;chosen.push(btn.dataset.step);btn.disabled=true;paint()});
    root.querySelector('[data-flow-reset]').onclick=()=>{chosen.splice(0);root.querySelectorAll('[data-step]').forEach(b=>b.disabled=false);paint();feedback(fb,false,'Fluxo limpo. Monte novamente na ordem correta.')};
    root.querySelector('[data-flow-check]').onclick=()=>{
      const ok=chosen.length===expected.length&&chosen.every((x,i)=>x===expected[i]);
      feedback(fb,ok,ok?'Fluxo correto: gatilho → validar entrada → regras → IA → validar saída → ação/log.':'Ainda não. Uma automação segura valida antes de interpretar e valida novamente antes de agir.');
      if(ok)complete({type:'automation'});
    };
  }

  function agentLab(){
    return frame('Agent Lab — escolha de ferramentas','agente',
      '<p class="v3-lab-instructions">Cenário: um cliente já cadastrado pediu suporte. O agente precisa localizar o cadastro, abrir um ticket e só então oferecer o envio de uma confirmação.</p>'+
      '<div class="v3-console" data-agent-log>Estado: pedido recebido. Nenhuma ferramenta executada.</div>'+
      '<div class="nx-agent-tools">'+
        '<button type="button" class="v3-btn secondary" data-tool="create">criar_cliente()</button>'+
        '<button type="button" class="v3-btn secondary" data-tool="find">buscar_cliente()</button>'+
        '<button type="button" class="v3-btn secondary" data-tool="ticket">criar_ticket()</button>'+
        '<button type="button" class="v3-btn secondary" data-tool="send">enviar_confirmacao()</button>'+
      '</div>'+
      '<div class="v3-feedback" data-feedback>Escolha a primeira ferramenta. Use o resultado real de cada chamada para decidir o próximo passo.</div>'
    );
  }
  function wireAgent(root){
    let stage=0;const log=root.querySelector('[data-agent-log]'),fb=root.querySelector('[data-feedback]');
    const expected=['find','ticket','send'];
    root.querySelectorAll('[data-tool]').forEach(btn=>btn.onclick=()=>{
      const tool=btn.dataset.tool;
      if(tool==='create'){feedback(fb,false,'Não crie um cliente antes de verificar se ele já existe.');return}
      if(tool!==expected[stage]){feedback(fb,false,stage===0?'Primeiro localize o cliente.':stage===1?'Use o ID encontrado para criar o ticket.':'A confirmação só pode ser enviada depois do ticket.');return}
      if(stage===0){log.textContent+='\\nbuscar_cliente({telefone}) → {id:91,nome:"Ana"}';stage++;feedback(fb,true,'Cliente encontrado. Agora use o ID real retornado para a próxima ferramenta.')}
      else if(stage===1){log.textContent+='\\ncriar_ticket({cliente_id:91,assunto:"suporte"}) → {id:302,status:"aberto"}';stage++;feedback(fb,true,'Ticket criado. A próxima ação envia comunicação: confirme conscientemente executando a ferramenta adequada.')}
      else {log.textContent+='\\nenviar_confirmacao({ticket_id:302}) → {status:"enviado"}';stage++;feedback(fb,true,'Fluxo concluído com ferramentas específicas, estado real e ordem controlada.');complete({type:'agent'})}
    });
  }

  function ragLab(){
    const chunks=[
      'Chunk A — Férias: solicitação deve ser enviada com antecedência mínima definida na política interna.',
      'Chunk B — Reembolso: despesas precisam de comprovante e aprovação conforme categoria.',
      'Chunk C — Acesso: credenciais são individuais e não devem ser compartilhadas.'
    ];
    return frame('RAG Lab — recuperação','rag',
      '<p class="v3-lab-instructions">Pergunta: “Posso compartilhar minha senha com um colega para ele terminar uma tarefa?” Selecione o chunk que deveria ser recuperado.</p><div class="v3-mcq">'+chunks.map((x,i)=>'<label class="v3-option"><input type="radio" name="rag" value="'+i+'"><span>'+esc(x)+'</span></label>').join('')+'</div><div class="v3-toolbar"><button class="v3-btn" type="button" data-rag>Verificar recuperação</button></div><div class="v3-feedback" data-feedback>Escolha pela evidência, não pela semelhança superficial.</div>'
    );
  }
  function wireRag(root){const fb=root.querySelector('[data-feedback]');root.querySelector('[data-rag]').onclick=()=>{const x=root.querySelector('input[name=rag]:checked');if(!x)return feedback(fb,false,'Selecione um chunk.');const ok=Number(x.value)===2;feedback(fb,ok,ok?'Correto. O Chunk C contém a regra relevante e deve fundamentar a resposta.':'Não é o trecho mais relevante. Procure a regra diretamente relacionada a credenciais.');if(ok)complete({type:'rag'})};}

  function codeAiLab(){
    return frame('IA + Código — revisão objetiva','code review',
      '<p class="v3-lab-instructions">A IA sugeriu o código abaixo. Identifique o principal problema antes de aceitar o diff.</p><pre class="v3-console">async function carregar(){\\n  const r = await fetch("/api/dados");\\n  const data = await r.json();\\n  return data;\\n}</pre><div class="v3-mcq"><label class="v3-option"><input type="radio" name="cr" value="0"><span>O nome da função é curto.</span></label><label class="v3-option"><input type="radio" name="cr" value="1"><span>Não verifica r.ok nem trata falha de rede/JSON.</span></label><label class="v3-option"><input type="radio" name="cr" value="2"><span>Usa async.</span></label></div><div class="v3-toolbar"><button class="v3-btn" type="button" data-cr>Verificar revisão</button></div><div class="v3-feedback" data-feedback></div>'
    );
  }
  function wireCodeAi(root){const fb=root.querySelector('[data-feedback]');root.querySelector('[data-cr]').onclick=()=>{const x=root.querySelector('input[name=cr]:checked');const ok=x&&Number(x.value)===1;feedback(fb,ok,ok?'Correto. Código gerado por IA precisa ser revisado como qualquer outro código.':'Revise comportamento de erro e respostas HTTP.');if(ok)complete({type:'code_ai'})};}

  function bossLab(module){
    return frame('Boss Fight — '+module,'projeto',
      '<p class="v3-lab-instructions">O Boss Fight não pede redação. Você deve entregar um artefato funcional: URL, repositório, planilha, imagem, fluxo ou aplicação — conforme o módulo.</p><div class="v3-rubric"><div><b>35%</b><br>Funciona</div><div><b>30%</b><br>Foi testado</div><div><b>25%</b><br>Segue critérios</div><div><b>10%</b><br>Entrega acessível</div></div><div class="v3-toolbar"><a class="v3-btn" href="projetos.html">Abrir Boss Fight do módulo →</a></div><div class="v3-feedback ok">Você pode concluir esta microaula após entender os critérios. A entrega do projeto acontece na área de Boss Fights.</div>'
    );
  }

  function productLab(module){
    return frame('Product Lab','decisão objetiva',
      '<p class="v3-lab-instructions">Escolha o MVP mais saudável para validar uma hipótese rapidamente.</p><div class="v3-mcq"><label class="v3-option"><input type="radio" name="prod" value="0"><span>20 telas, 5 planos e 12 integrações antes do primeiro usuário.</span></label><label class="v3-option"><input type="radio" name="prod" value="1"><span>Um fluxo principal resolvendo um problema específico, com uma métrica de ativação.</span></label><label class="v3-option"><input type="radio" name="prod" value="2"><span>Somente identidade visual e landing sem testar o fluxo principal.</span></label></div><div class="v3-toolbar"><button class="v3-btn" type="button" data-prod>Validar decisão</button></div><div class="v3-feedback" data-feedback></div>'
    );
  }
  function wireProduct(root){const fb=root.querySelector('[data-feedback]');root.querySelector('[data-prod]').onclick=()=>{const x=root.querySelector('input[name=prod]:checked');const ok=x&&Number(x.value)===1;feedback(fb,ok,ok?'Correto. O MVP testa valor com o menor escopo coerente.':'Priorize problema, fluxo principal e métrica observável.');if(ok)complete({type:'product'})};}

  function authLab(){
    return frame('Auth Lab — identidade x permissão','segurança',
      '<p class="v3-lab-instructions">Cenário: usuário A está logado e tenta consultar uma nota criada pelo usuário B. Qual regra protege melhor o dado no banco?</p><div class="v3-mcq"><label class="v3-option"><input type="radio" name="auth" value="0"><span>WHERE true</span></label><label class="v3-option"><input type="radio" name="auth" value="1"><span>USING (auth.uid() = user_id)</span></label><label class="v3-option"><input type="radio" name="auth" value="2"><span>Ocultar o botão no frontend</span></label></div><div class="v3-toolbar"><button class="v3-btn" type="button" data-auth>Verificar regra</button></div><div class="v3-feedback" data-feedback></div>'
    );
  }
  function wireAuth(root){const fb=root.querySelector('[data-feedback]');root.querySelector('[data-auth]').onclick=()=>{const x=root.querySelector('input[name=auth]:checked');const ok=x&&Number(x.value)===1;feedback(fb,ok,ok?'Correto. A autorização precisa ser aplicada também na camada de dados.':'Esconder a interface não impede uma requisição direta ao backend.');if(ok)complete({type:'auth'})};}


  function dataModelLab(ctx){
    const cfg=ctx.lesson?.lab_config?.data_model||{};
    const options=Array.isArray(cfg.options)&&cfg.options.length>=2?cfg.options:['Dado mutável','Constante da regra','Texto a validar','Booleano'];
    const rows=Array.isArray(cfg.rows)?cfg.rows:[];
    const scenario=cfg.scenario||'Classifique cada elemento de acordo com o papel que ele exerce na solução.';
    return frame('Data Model Lab','modelagem de dados',
      '<p class="v3-lab-instructions">'+esc(scenario)+'</p>'+
      '<div class="nx-data-model-grid" data-data-model>'+
        rows.map((row,i)=>'<div class="v3-option nx-data-model-row"><div><b>'+esc(row.label||('Item '+(i+1)))+'</b>'+(row.value!=null?'<small><code>'+esc(String(row.value))+'</code></small>':'')+(row.hint?'<small>'+esc(row.hint)+'</small>':'')+'</div><select aria-label="Classificar '+esc(row.label||('item '+(i+1)))+'" data-data-model-answer="'+i+'"><option value="">Classifique…</option>'+options.map((o,idx)=>'<option value="'+idx+'">'+esc(o)+'</option>').join('')+'</select></div>').join('')+
      '</div><div class="v3-toolbar"><button class="v3-btn" type="button" data-data-model-check>Validar modelo</button></div>'+
      '<div class="v3-feedback" data-feedback>Classifique todos os itens antes de validar.</div>'
    );
  }
  function wireDataModel(root,ctx){
    const cfg=ctx.lesson?.lab_config?.data_model||{},rows=Array.isArray(cfg.rows)?cfg.rows:[],fb=root.querySelector('[data-feedback]'),btn=root.querySelector('[data-data-model-check]');
    btn.onclick=()=>{
      const selects=[...root.querySelectorAll('[data-data-model-answer]')];
      if(selects.some(x=>x.value===''))return feedback(fb,false,'Classifique todos os itens antes de validar.');
      let correct=0;
      selects.forEach((sel,i)=>{
        const ok=Number(sel.value)===Number(rows[i]?.answer);
        sel.closest('.nx-data-model-row')?.classList.toggle('correct',ok);
        sel.closest('.nx-data-model-row')?.classList.toggle('wrong',!ok);
        if(ok)correct++;
      });
      const ok=correct===rows.length&&rows.length>0;
      feedback(fb,ok,ok?(cfg.feedback||'Modelo correto. Você distinguiu o papel dos dados antes de construir a expressão.'):(cfg.feedback_incorrect||('Você acertou '+correct+' de '+rows.length+'. Revise significado, estabilidade e tipo de cada dado.')));
      if(ok){btn.disabled=true;complete({type:'data_model',score:correct,total:rows.length})}
    };
  }

  function decisionTableLab(ctx){
    const cfg=ctx.lesson?.lab_config?.decision_table||{};
    const outcomes=Array.isArray(cfg.outcomes)?cfg.outcomes:[];
    const rows=Array.isArray(cfg.rows)?cfg.rows:[];
    return frame(cfg.title||'Decision Table Lab','tabela de decisão',
      '<p class="v3-lab-instructions">'+esc(cfg.scenario||'Classifique cada caso usando o resultado correto da regra.')+'</p>'+
      '<div class="nx-data-model-grid" data-decision-table>'+
        rows.map((row,i)=>'<div class="v3-option nx-data-model-row"><div><b>'+esc(row.case||('Caso '+(i+1)))+'</b>'+(row.hint?'<small>'+esc(row.hint)+'</small>':'')+'</div><select aria-label="Resultado para '+esc(row.case||('caso '+(i+1)))+'" data-decision-answer="'+i+'"><option value="">Escolha…</option>'+outcomes.map((o,idx)=>'<option value="'+idx+'">'+esc(o)+'</option>').join('')+'</select></div>').join('')+
      '</div><div class="v3-toolbar"><button class="v3-btn" type="button" data-decision-check>Validar tabela</button></div><div class="v3-feedback" data-feedback>Classifique todos os casos antes de validar.</div>'
    );
  }
  function wireDecisionTable(root,ctx){
    const cfg=ctx.lesson?.lab_config?.decision_table||{},rows=Array.isArray(cfg.rows)?cfg.rows:[],fb=root.querySelector('[data-feedback]'),btn=root.querySelector('[data-decision-check]');
    if(!btn)return;
    btn.onclick=()=>{
      const selects=[...root.querySelectorAll('[data-decision-answer]')];
      if(!rows.length||selects.some(x=>x.value===''))return feedback(fb,false,'Classifique todos os casos antes de validar.');
      let correct=0;
      selects.forEach((sel,i)=>{
        const ok=Number(sel.value)===Number(rows[i]?.answer);
        sel.closest('.nx-data-model-row')?.classList.toggle('correct',ok);
        sel.closest('.nx-data-model-row')?.classList.toggle('wrong',!ok);
        if(ok)correct++;
      });
      const ok=correct===rows.length;
      feedback(fb,ok,ok?(cfg.feedback||'Tabela consistente. Você aplicou a regra a todos os casos.'):(cfg.feedback_incorrect||('Você acertou '+correct+' de '+rows.length+'. Revise as condições e as fronteiras da regra.')));
      if(ok){btn.disabled=true;complete({type:'decision_table',score:correct,total:rows.length})}
    };
  }

  function expressionLab(ctx){
    const cfg=ctx.lesson?.lab_config?.expression||{};
    const options=Array.isArray(cfg.options)?cfg.options:[],cases=Array.isArray(cfg.cases)?cfg.cases:[];
    return frame(cfg.title||'Expression Lab','expressões',
      '<p class="v3-lab-instructions">'+esc(cfg.scenario||'Escolha a expressão que representa a regra e valide-a contra os casos de teste.')+'</p>'+
      (cfg.instruction?'<div class="v3-feedback">'+esc(cfg.instruction)+'</div>':'')+
      '<div class="v3-mcq" data-expression-options>'+options.map((o,i)=>'<button type="button" class="v3-option" data-expression-option="'+i+'"><span><b>'+String.fromCharCode(65+i)+'.</b> <code>'+esc(o)+'</code></span></button>').join('')+'</div>'+
      (cases.length?'<div class="nx-expression-cases"><div class="eyebrow">CASOS DE TESTE</div>'+cases.map(x=>'<div class="nx-expression-case"><span>'+esc(x.input||'Caso')+'</span><strong>'+esc(x.expected||'')+'</strong></div>').join('')+'</div>':'')+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-expression-check>Executar cenários</button></div>'+
      '<div class="v3-feedback" data-feedback>Escolha uma expressão e confronte-a com todos os casos, especialmente os limites.</div>'
    );
  }
  function wireExpression(root,ctx){
    const cfg=ctx.lesson?.lab_config?.expression||{},answer=Number(cfg.answer||0),btn=root.querySelector('[data-expression-check]'),fb=root.querySelector('[data-feedback]');
    const optionRoot=root.querySelector('[data-expression-options]');
    optionRoot.querySelectorAll('[data-expression-option]').forEach(x=>x.onclick=()=>{optionRoot.querySelectorAll('[data-expression-option]').forEach(y=>y.classList.remove('selected'));x.classList.add('selected');optionRoot.dataset.selected=x.dataset.expressionOption});
    btn.onclick=()=>{
      if(optionRoot.dataset.selected==null)return feedback(fb,false,'Escolha uma expressão antes de executar os cenários.');
      const chosen=Number(optionRoot.dataset.selected),ok=chosen===answer;
      optionRoot.querySelectorAll('[data-expression-option]').forEach((o,i)=>{o.classList.toggle('correct',i===answer);o.classList.toggle('wrong',i===chosen&&!ok)});
      feedback(fb,ok,ok?(cfg.feedback||'A expressão representa a regra e permanece correta nos casos de teste.'):(cfg.feedback_incorrect||'Essa expressão falha em pelo menos um cenário. Releia a regra e teste novamente os limites.'));
      if(ok){btn.disabled=true;complete({type:'expression',answer:chosen})}
    };
  }

  function render(el,ctx){
    if(!el)return;
    state.complete=false;
    const module=ctx.module?.title||ctx.lesson?.lab_config?.module||'Módulo';
    const type=ctx.lesson?.lab_type||'checkpoint';
    let html='';
    if(type==='logic')html=logicLab();
    else if(type==='data_model')html=dataModelLab(ctx);
    else if(type==='decision_table')html=decisionTableLab(ctx);
    else if(type==='expression')html=expressionLab(ctx);
    else if(type==='pseudocode')html=pseudocodeLab();
    else if(type==='prompt')html=promptLab(module);
    else if(type==='spreadsheet')html=spreadsheetLab();
    else if(type==='javascript')html=javascriptLab('javascript');
    else if(type==='typescript')html=javascriptLab('typescript');
    else if(type==='python')html=pythonLab(ctx);
    else if(type==='react')html=reactLab();
    else if(type==='html')html=htmlLab();
    else if(type==='sql')html=sqlLab();
    else if(type==='terminal')html=terminalLab(module);
    else if(type==='api')html=apiLab();
    else if(type==='automation')html=automationLab();
    else if(type==='agent')html=agentLab();
    else if(type==='rag')html=ragLab();
    else if(type==='auth')html=authLab();
    else if(type==='code_ai')html=codeAiLab();
    else if(type==='product')html=productLab(module);
    else if(type==='project'||type==='boss')html=bossLab(module);
    else html=mcq(module,ctx.lesson?.lab_config?.checkpoint);
    el.innerHTML=html;
    if(type==='logic')wireLogic(el);
    else if(type==='data_model')wireDataModel(el,ctx);
    else if(type==='decision_table')wireDecisionTable(el,ctx);
    else if(type==='expression')wireExpression(el,ctx);
    else if(type==='pseudocode')wirePseudocode(el);
    else if(type==='prompt')wirePrompt(el,module);
    else if(type==='spreadsheet')wireSheet(el);
    else if(type==='javascript')wireJs(el,'javascript');
    else if(type==='typescript')wireJs(el,'typescript');
    else if(type==='python')wirePython(el,ctx);
    else if(type==='react')wireReact(el);
    else if(type==='html')wireHtml(el);
    else if(type==='sql')wireSql(el);
    else if(type==='terminal')wireTerminal(el,module);
    else if(type==='api')wireApi(el);
    else if(type==='automation')wireAutomation(el);
    else if(type==='agent')wireAgent(el);
    else if(type==='rag')wireRag(el);
    else if(type==='auth')wireAuth(el);
    else if(type==='code_ai')wireCodeAi(el);
    else if(type==='product')wireProduct(el);
    else if(type==='project'||type==='boss'){complete({type:'boss-info'})}
    else wireMcq(el,module,ctx.lesson?.lab_config?.checkpoint);
  }
  window.LCLabs={render,isComplete:()=>state.complete};
})();
