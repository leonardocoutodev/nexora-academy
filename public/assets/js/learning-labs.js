
(()=> {
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const state={complete:false};
  const complete=(detail={})=>{state.complete=true;window.dispatchEvent(new CustomEvent('nexora:lab-complete',{detail}));};

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

  function mcq(module,title='Checkpoint rápido'){
    const b=bank(module);
    return frame(title,'múltipla escolha',
      '<p class="v3-lab-instructions">'+esc(b.q)+'</p><div class="v3-mcq" data-mcq>'+
      b.opts.map((o,i)=>'<label class="v3-option"><input type="radio" name="v3q" value="'+i+'"><span><b>'+String.fromCharCode(65+i)+'.</b> '+esc(o)+'</span></label>').join('')+
      '</div><div class="v3-toolbar"><button class="v3-btn" type="button" data-check>Verificar resposta</button></div><div class="v3-feedback" data-feedback>Escolha uma alternativa.</div>'
    );
  }
  function wireMcq(root,module){
    const b=bank(module),btn=root.querySelector('[data-check]'),fb=root.querySelector('[data-feedback]');
    root.querySelectorAll('.v3-option').forEach(x=>x.onclick=()=>{root.querySelectorAll('.v3-option').forEach(y=>y.classList.remove('selected'));x.classList.add('selected')});
    btn.onclick=()=>{const x=root.querySelector('input[name=v3q]:checked');if(!x)return feedback(fb,false,'Escolha uma alternativa antes de verificar.');const ok=Number(x.value)===b.a;root.querySelectorAll('.v3-option').forEach((o,i)=>{o.classList.toggle('correct',i===b.a);o.classList.toggle('wrong',i===Number(x.value)&&!ok)});feedback(fb,ok,ok?b.ok:'Ainda não. Observe o procedimento demonstrado na microaula e tente novamente.');if(ok){btn.disabled=true;complete({type:'mcq'})}};
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
      '<p class="v3-lab-instructions">'+(kind==='typescript'?'Edite o exemplo e use o verificador de tipos conceitual. A execução usa JavaScript equivalente no navegador.':'Edite e execute o código sem sair da Nexora. O console aparece logo abaixo.')+'</p>'+
      '<textarea class="v3-editor" data-code>'+esc(starter)+'</textarea>'+
      '<div class="v3-toolbar"><button class="v3-btn" type="button" data-run>▶ Executar</button>'+(kind==='typescript'?'<button class="v3-btn secondary" type="button" data-typecheck>Verificar tipos</button>':'')+'</div>'+
      '<pre class="v3-console" data-console>Pronto para executar.</pre>'
    );
  }
  function wireJs(root,kind){
    const ed=root.querySelector('[data-code]'),out=root.querySelector('[data-console]');
    const run=()=>{
      if(kind==='typescript'){
        const stripped=ed.value.replace(/type\s+\w+\s*=\s*\{[^}]*\};?/gs,'').replace(/:\s*\w+(\[\])?/g,'');
        try{const logs=[];new Function('console',stripped)({log:(...a)=>logs.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x,null,2)).join(' '))});out.textContent=logs.join('\n')||'Código executado sem saída.';complete({type:'typescript'})}catch(e){out.textContent='Erro: '+e.message}
      }else{
        const iframe=document.createElement('iframe');iframe.sandbox='allow-scripts';iframe.style.display='none';document.body.appendChild(iframe);
        const code=JSON.stringify(ed.value);
        iframe.srcdoc='<script>window.addEventListener("message",e=>{const logs=[];const c={log:(...a)=>logs.push(a.map(x=>{try{return typeof x==="string"?x:JSON.stringify(x)}catch{return String(x)}}).join(" "))};try{new Function("console",e.data)(c);parent.postMessage({nexoraConsole:logs.join("\\n")||"Código executado sem saída."},"*")}catch(err){parent.postMessage({nexoraConsole:"Erro: "+err.message},"*")}});<\/script>';
        const listener=e=>{if(e.data&&e.data.nexoraConsole!==undefined){out.textContent=e.data.nexoraConsole;window.removeEventListener('message',listener);iframe.remove();if(!String(e.data.nexoraConsole).startsWith('Erro:'))complete({type:'javascript'})}};
        window.addEventListener('message',listener);setTimeout(()=>iframe.contentWindow.postMessage(ed.value,'*'),80);setTimeout(()=>{if(iframe.isConnected){out.textContent='Execução interrompida por limite de tempo.';iframe.remove();window.removeEventListener('message',listener)}},1800);
      }
    };
    root.querySelector('[data-run]').onclick=run;
    const tc=root.querySelector('[data-typecheck]');if(tc)tc.onclick=()=>{const good=/type |interface /.test(ed.value)&&!/:\s*any\b/.test(ed.value);out.textContent=good?'✓ Há modelagem explícita e nenhum any evidente.':'Revise: declare um type/interface e evite any quando possível.';if(good)complete({type:'typescript'})};
  }

  function htmlLab(){
    const starter='<main>\\n  <h1>Minha primeira página</h1>\\n  <button id="acao">Testar</button>\\n</main>\\n<style>body{font-family:Arial;padding:24px}button{padding:10px 16px}</style>\\n<script>document.querySelector("#acao").onclick=()=>document.querySelector("h1").textContent="Funcionou!"<\\/script>';
    return frame('Web Lab — HTML/CSS/JS','preview',
      '<p class="v3-lab-instructions">Edite a página e veja o resultado dentro da aula. O preview roda em um iframe isolado.</p><textarea class="v3-editor" data-html>'+esc(starter)+'</textarea><div class="v3-toolbar"><button class="v3-btn" type="button" data-preview>Atualizar preview</button></div><iframe class="v3-preview" sandbox="allow-scripts" data-preview-frame></iframe>'
    );
  }
  function wireHtml(root){root.querySelector('[data-preview]').onclick=()=>{root.querySelector('[data-preview-frame]').srcdoc=root.querySelector('[data-html]').value;complete({type:'html'})};}

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
    const cloud=module.toLowerCase().includes('cloudflare');
    const steps=cloud?['npx wrangler --version','npx wrangler dev','npx wrangler deploy']:['git status','git add .','git commit -m "feat: minha alteração"','git push'];
    return frame(cloud?'Terminal Cloudflare':'Terminal Git','terminal',
      '<p class="v3-lab-instructions">Digite os comandos no terminal simulado. Nada é executado no seu computador; o objetivo é aprender sequência, sintaxe e interpretação da saída.</p><pre class="v3-console" data-term-out>$ ambiente Nexora pronto</pre><div class="v3-api-row" style="margin-top:10px"><input data-term placeholder="'+esc(steps[0])+'"><button class="v3-btn" type="button" data-term-send>Executar</button></div><small class="muted" data-term-help style="display:block;margin-top:10px">Próximo objetivo: '+esc(steps[0])+'</small>'
    );
  }
  function wireTerminal(root,module){
    const cloud=module.toLowerCase().includes('cloudflare'),steps=cloud?['npx wrangler --version','npx wrangler dev','npx wrangler deploy']:['git status','git add .','git commit -m "feat: minha alteração"','git push'];let i=0;
    const inp=root.querySelector('[data-term]'),out=root.querySelector('[data-term-out]'),help=root.querySelector('[data-term-help]');
    root.querySelector('[data-term-send]').onclick=()=>{const cmd=inp.value.trim();if(cmd!==steps[i]){out.textContent+='\n$ '+cmd+'\nComando válido, mas a missão atual espera: '+steps[i];return}out.textContent+='\n$ '+cmd+'\n'+(cloud?(i===0?'wrangler 4.x':i===1?'Ready on http://localhost:8787':'Deployed successfully ✓'):(i===0?'working tree status exibido':i===1?'changes staged':i===2?'commit criado ✓':'push concluído ✓'));i++;inp.value='';if(i>=steps.length){help.textContent='✓ Sequência concluída.';complete({type:'terminal'})}else{help.textContent='Próximo objetivo: '+steps[i];inp.placeholder=steps[i]}};
  }

  function apiLab(){
    return frame('API Playground','http',
      '<p class="v3-lab-instructions">Envie requisições para uma API simulada da Nexora. Assim você pratica método, rota, status e JSON sem Postman.</p><div class="v3-api-row"><select data-method><option>GET</option><option>POST</option></select><input data-path value="/api/produtos"><button class="v3-btn" type="button" data-send>Enviar</button></div><textarea class="v3-editor small" data-body style="margin-top:10px" placeholder=\'{"nome":"Teclado","preco":250}\'></textarea><pre class="v3-console" data-api-out>HTTP aguardando requisição...</pre>'
    );
  }
  function wireApi(root){
    const out=root.querySelector('[data-api-out]');
    root.querySelector('[data-send]').onclick=()=>{const method=root.querySelector('[data-method]').value,path=root.querySelector('[data-path]').value.trim();if(path!='/api/produtos'){out.textContent='HTTP 404\\n{"error":"Rota não encontrada"}';return}if(method==='GET'){out.textContent='HTTP 200\\n'+JSON.stringify({produtos:[{id:1,nome:'Mouse',preco:120},{id:2,nome:'Monitor',preco:800}]},null,2);complete({type:'api'})}else{try{const body=JSON.parse(root.querySelector('[data-body]').value||'{}');if(!body.nome||!Number.isFinite(Number(body.preco)))throw new Error('nome e preco são obrigatórios');out.textContent='HTTP 201\\n'+JSON.stringify({id:3,...body},null,2);complete({type:'api'})}catch(e){out.textContent='HTTP 422\\n'+JSON.stringify({error:e.message},null,2)}}};
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

  function render(el,ctx){
    if(!el)return;
    state.complete=false;
    const module=ctx.module?.title||ctx.lesson?.lab_config?.module||'Módulo';
    const type=ctx.lesson?.lab_type||'checkpoint';
    let html='';
    if(type==='prompt')html=promptLab(module);
    else if(type==='spreadsheet')html=spreadsheetLab();
    else if(type==='javascript')html=javascriptLab('javascript');
    else if(type==='typescript')html=javascriptLab('typescript');
    else if(type==='html')html=htmlLab();
    else if(type==='sql')html=sqlLab();
    else if(type==='terminal')html=terminalLab(module);
    else if(type==='api')html=apiLab();
    else if(type==='rag')html=ragLab();
    else if(type==='auth')html=authLab();
    else if(type==='code_ai')html=codeAiLab();
    else if(type==='product')html=productLab(module);
    else if(type==='project'||type==='boss')html=bossLab(module);
    else html=mcq(module);
    el.innerHTML=html;
    if(type==='prompt')wirePrompt(el,module);
    else if(type==='spreadsheet')wireSheet(el);
    else if(type==='javascript')wireJs(el,'javascript');
    else if(type==='typescript')wireJs(el,'typescript');
    else if(type==='html')wireHtml(el);
    else if(type==='sql')wireSql(el);
    else if(type==='terminal')wireTerminal(el,module);
    else if(type==='api')wireApi(el);
    else if(type==='rag')wireRag(el);
    else if(type==='auth')wireAuth(el);
    else if(type==='code_ai')wireCodeAi(el);
    else if(type==='product')wireProduct(el);
    else if(type==='project'||type==='boss'){complete({type:'boss-info'})}
    else wireMcq(el,module);
  }
  window.NexoraLabs={render,isComplete:()=>state.complete};
})();