export const IDS={
  user:'11111111-1111-4111-8111-111111111111',
  course:'95e7ad39-a605-44ec-807e-01337a2664d6',
  module:'04f15475-b330-45d4-9228-084f1a104d6e',
  lesson:'a6b6f783-10ee-491a-85b9-48b6d5618150',
  lesson2:'bd010871-3109-4507-bb41-03ab62fcda83',
  lessonData:'c1111111-1111-4111-8111-111111111111',
  lessonExpression:'c2222222-2222-4222-8222-222222222222',
  lessonDecision:'c3333333-3333-4333-8333-333333333333',
  assessment:'22222222-2222-4222-8222-222222222222',
  question:'33333333-3333-4333-8333-333333333333',
  project:'44444444-4444-4444-8444-444444444444',
  submission:'55555555-5555-4555-8555-555555555555',
  certificate:'66666666-6666-4666-8666-666666666666',
  enrollment:'77777777-7777-4777-8777-777777777777'
};

const json=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});

export async function installMockSupabase(page,{role='student'}={}){
  await page.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,route=>route.abort());
  const state={certificateIssued:false,projectSubmitted:false};
  await page.addInitScript(()=>{
    localStorage.setItem('lc.supabase.session',JSON.stringify({
      access_token:'e2e-access',
      refresh_token:'e2e-refresh',
      expires_at:4102444800
    }));
  });
  await page.route('https://kvwsqfnyebyjncfgvqnd.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method();
    if(path==='/auth/v1/user')return json(route,{id:IDS.user,email:'qa@lc.invalid',user_metadata:{full_name:'Aluno QA'}});
    if(path==='/auth/v1/logout')return json(route,{});

    if(path==='/rest/v1/profiles')return json(route,[{id:IDS.user,full_name:role==='admin'?'Administrador QA':'Aluno QA',role,status:'active'}]);
    if(path==='/rest/v1/rpc/identify_analytics_session')return json(route,1);
    if(path==='/rest/v1/rpc/track_product_event')return json(route,'88888888-8888-4888-8888-888888888888');
    if(path==='/rest/v1/rpc/get_gamification_summary')return json(route,[{xp_total:650,level:2,current_streak:4}]);

    if(path==='/rest/v1/courses'){
      return json(route,[{id:IDS.course,slug:'logica-programacao-basica',title:'Lógica de Programação Básica',description:'Aprenda a estruturar problemas antes de programar.',minimum_score:70,position:1,course_type:'foundation',level_label:'Iniciante',category_label:'Fundamentos de Programação',is_recommended_start:true,recommendation_note:'Comece por aqui.'}]);
    }
    if(path==='/rest/v1/modules')return json(route,[{id:IDS.module,course_id:IDS.course,title:'Pensar antes de programar',description:'Fundamentos do raciocínio lógico.',position:1,prerequisite_module_id:null}]);
    if(path==='/rest/v1/lessons'){
      if(url.searchParams.get('id')||url.search.includes('id=eq.')){
        if(url.search.includes(IDS.lessonData))return json(route,[{id:IDS.lessonData,module_id:IDS.module,title:'Variáveis e constantes',objective:'Classificar o papel de cada dado.',estimated_minutes:24,position:2,lab_type:'data_model',lab_config:{data_model:{scenario:'Classifique os elementos do pedido.',options:['Dado mutável','Constante da regra','Texto a validar','Booleano'],rows:[{label:'valorPedido',value:'349.90',answer:0},{label:'LIMITE_FRETE',value:'300',answer:1},{label:'idadeDigitada',value:'"18"',answer:2},{label:'clienteAtivo',value:'true',answer:3}],feedback:'Modelo correto.'}},xp_reward:100,difficulty:1,content:[{type:'concept',body:'Dados diferentes exercem papéis diferentes.'},{type:'recap',body:'Classifique antes de combinar.'}]}]);
        if(url.search.includes(IDS.lessonExpression))return json(route,[{id:IDS.lessonExpression,module_id:IDS.module,title:'Expressões e fronteiras',objective:'Validar uma expressão contra casos de teste.',estimated_minutes:26,position:3,lab_type:'expression',lab_config:{expression:{title:'Expression Lab',scenario:'Frete grátis a partir de R$ 300.',options:['valor > 300','valor >= 300','valor == 300'],answer:1,cases:[{input:'299',expected:'falso'},{input:'300',expected:'verdadeiro'},{input:'301',expected:'verdadeiro'}],feedback:'A expressão preserva a fronteira.'}},xp_reward:100,difficulty:2,content:[{type:'concept',body:'Fronteiras precisam ser testadas.'},{type:'recap',body:'Teste antes, no limite e depois.'}]}]);
        if(url.search.includes(IDS.lessonDecision))return json(route,[{id:IDS.lessonDecision,module_id:IDS.module,title:'Tabela de decisão aplicada',objective:'Classificar casos de acesso por uma regra booleana.',estimated_minutes:28,position:4,lab_type:'decision_table',lab_config:{decision_table:{title:'Decision Table — acesso',scenario:'Acesso exige conta ativa E e-mail verificado.',outcomes:['Liberar','Bloquear'],rows:[{case:'ativa=true, verificado=true',answer:0},{case:'ativa=true, verificado=false',answer:1},{case:'ativa=false, verificado=true',answer:1}],feedback:'Tabela consistente.',feedback_incorrect:'Revise a condição E.'}},xp_reward:100,difficulty:2,content:[{type:'concept',body:'Uma tabela de decisão cobre combinações relevantes.'},{type:'recap',body:'Cubra casos válidos e bloqueados.'}]}]);
        return json(route,[{id:IDS.lesson,module_id:IDS.module,title:'O que é programar',objective:'Diferenciar programação de linguagem e reconhecer um programa como uma sequência precisa.',estimated_minutes:22,position:1,lab_type:'logic',lab_config:{checkpoint:{question:'Qual descrição representa melhor um programa?',options:['Uma sequência precisa que recebe dados, aplica regras e produz resultado.','Apenas uma linguagem de programação.'],answer:0,feedback:'Correto.'}},xp_reward:100,difficulty:1,content:[
          {type:'story',body:'Um programa resolve um problema por meio de instruções precisas e verificáveis.'},
          {type:'concept',body:'Programar é transformar uma intenção em uma sequência de passos que uma máquina consegue executar.',question:'Qual opção descreve melhor programar?',options:['Definir instruções verificáveis para resolver um problema.','Escolher cores para uma interface.'],answer:0,feedback:'Isso. O foco é transformar regras em instruções.',feedback_incorrect:'Retome a definição acima.'},
          {type:'example',body:'Um sistema de frete recebe valor e CEP, aplica regras e devolve o preço.'},
          {type:'recap',body:'Problema, entrada, regra e saída formam uma base observável.'}
        ]}]);
      }
      return json(route,[
        {id:IDS.lesson,module_id:IDS.module,title:'O que é programar',estimated_minutes:22,position:1,xp_reward:100,lab_type:'logic'},
        {id:IDS.lesson2,module_id:IDS.module,title:'Problema, entrada, processamento e saída',estimated_minutes:22,position:2,xp_reward:100,lab_type:'logic'},
        {id:IDS.lessonData,module_id:IDS.module,title:'Variáveis e constantes',estimated_minutes:24,position:3,xp_reward:100,lab_type:'data_model'},
        {id:IDS.lessonExpression,module_id:IDS.module,title:'Expressões e fronteiras',estimated_minutes:26,position:4,xp_reward:100,lab_type:'expression'},
        {id:IDS.lessonDecision,module_id:IDS.module,title:'Tabela de decisão aplicada',estimated_minutes:28,position:5,xp_reward:100,lab_type:'decision_table'}
      ]);
    }
    if(path==='/rest/v1/lesson_progress')return json(route,[]);
    if(path==='/rest/v1/learning_resources')return json(route,[]);
    if(path==='/rest/v1/curriculum_references')return json(route,[]);
    if(path==='/rest/v1/enrollments')return json(route,[{id:IDS.enrollment,course_id:IDS.course,status:'active',enrolled_at:'2026-08-28T12:00:00Z'}]);
    if(path==='/rest/v1/learning_paths')return json(route,[]);
    if(path==='/rest/v1/learning_path_courses')return json(route,[]);
    if(path==='/rest/v1/user_learning_preferences')return json(route,[]);
    if(path==='/rest/v1/learning_credits')return json(route,[]);

    if(path==='/rest/v1/assessments')return json(route,[{id:IDS.assessment,title:'Checkpoint aplicado',pass_score:70,max_attempts:3,module_id:IDS.module,course_id:IDS.course,status:'published'}]);
    if(path==='/rest/v1/questions')return json(route,[{id:IDS.question,prompt:'Qual opção representa melhor um algoritmo?',question_type:'single_choice',position:1,options:[{id:'a',label:'Uma sequência finita e ordenada de passos.'},{id:'b',label:'Uma cor de interface.'}]}]);
    if(path==='/rest/v1/rpc/check_assessment_question')return json(route,[{correct:true,feedback:'Correto. Você aplicou o conceito.'}]);
    if(path==='/rest/v1/rpc/submit_assessment')return json(route,[{passed:true,score:100,correct:1,total:1}]);
    if(path==='/rest/v1/rpc/claim_assessment_xp')return json(route,[{xp_awarded:150,level:2}]);
    if(path==='/rest/v1/rpc/complete_lesson_mission')return json(route,[{xp_awarded:100,level:2,current_streak:4}]);

    if(path==='/rest/v1/projects')return json(route,[{id:IDS.project,course_id:IDS.course,module_id:IDS.module,title:'Boss Fight — Modelagem de problema',description:'Entregue uma solução verificável.',rubric:{criteria:[{name:'Clareza',weight:50},{name:'Validação',weight:50}]},project_kind:'boss',xp_reward:400,status:'published',created_at:'2026-08-28T12:00:00Z'}]);
    if(path==='/rest/v1/project_submissions'){
      if(method==='POST'){state.projectSubmitted=true;return json(route,[{id:IDS.submission,project_id:IDS.project,status:'submitted'}])}
      return json(route,state.projectSubmitted?[{id:IDS.submission,project_id:IDS.project,submission_url:'https://example.com/projeto',status:'submitted',score:null,feedback:null,submitted_at:'2026-08-28T12:00:00Z',reviewed_at:null}]:[]);
    }

    if(path==='/rest/v1/certificates'){
      return json(route,state.certificateIssued?[{id:IDS.certificate,course_id:IDS.course,verification_code:'LC-QA-2026',issued_at:'2026-08-28T12:00:00Z'}]:[]);
    }
    if(path==='/rest/v1/rpc/certificate_eligibility')return json(route,[{eligible:true,reason:'Todos os requisitos acadêmicos foram concluídos.'}]);
    if(path==='/rest/v1/rpc/try_issue_certificate'){state.certificateIssued=true;return json(route,[{issued:true,reason:'Certificado emitido.'}])}

    if(path==='/rest/v1/rpc/admin_operational_summary')return json(route,[{students:12,active_students:10,blocked_students:1,active_enrollments:14,completed_enrollments:3,completed_lessons:92,assessment_attempts:18,pending_boss:2,revision_boss:1,approved_boss:5,certificates:4,published_courses:9,published_lessons:368}]);
    if(path==='/rest/v1/rpc/admin_student_roster')return json(route,[{user_id:IDS.user,full_name:'Aluno QA',email:'qa@lc.invalid',role:'student',status:'active',created_at:'2026-08-20T12:00:00Z',enrollments_count:1,active_enrollments:1,completed_lessons:7,average_progress:72,assessment_attempts:2,average_score:88,boss_submissions:1,certificates_count:1,last_activity:'2026-08-28T17:00:00Z'}]);
    if(path==='/rest/v1/rpc/admin_student_detail')return json(route,[{profile:{id:IDS.user,full_name:'Aluno QA',email:'qa@lc.invalid',role:'student',status:'active',created_at:'2026-08-20T12:00:00Z',updated_at:'2026-08-28T17:00:00Z'},enrollments:[{id:IDS.enrollment,course_id:IDS.course,course_title:'Lógica de Programação Básica',status:'active',enrolled_at:'2026-08-20T12:00:00Z',completed_at:null,completed_lessons:7,total_lessons:10,progress_percent:70}],attempts:[{id:'99999999-9999-4999-8999-999999999999',score:88,submitted_at:'2026-08-27T12:00:00Z',assessment_title:'Checkpoint aplicado',course_title:'Lógica de Programação Básica',module_title:'Pensar antes de programar'}],submissions:[],certificates:state.certificateIssued?[{id:IDS.certificate,course_id:IDS.course,course_title:'Lógica de Programação Básica',verification_code:'LC-ADMIN-2026',issued_at:'2026-08-28T19:45:00Z'}]:[]}]);
    if(path==='/rest/v1/rpc/admin_update_profile')return json(route,[{id:IDS.user,status:'active',role:'student'}]);
    if(path==='/rest/v1/rpc/admin_update_enrollment')return json(route,[{id:IDS.enrollment,status:'active'}]);
    if(path==='/rest/v1/rpc/admin_create_enrollment')return json(route,[{id:IDS.enrollment,status:'active',course_id:IDS.course}]);
    if(path==='/rest/v1/rpc/admin_boss_roster')return json(route,[{submission_id:IDS.submission,user_id:IDS.user,student_name:'Aluno QA',email:'qa@lc.invalid',project_id:IDS.project,project_title:'Boss Fight — Modelagem de problema',course_id:IDS.course,course_title:'Lógica de Programação Básica',module_title:'Pensar antes de programar',rubric:{criteria:[{name:'Clareza',weight:50},{name:'Validação',weight:50}]},xp_reward:400,submission_url:'https://example.com/projeto',status:'submitted',score:null,feedback:null,submitted_at:'2026-08-28T12:00:00Z',reviewed_at:null}]);
    if(path==='/rest/v1/rpc/admin_certificate_status')return json(route,[{eligible:true,reason:'Todos os requisitos acadêmicos foram concluídos.',issued:false}]);
    if(path==='/rest/v1/rpc/admin_issue_certificate'){state.certificateIssued=true;return json(route,[{issued:true,already_existed:false,manual_override:false,verification_code:'LC-ADMIN-2026',issued_at:'2026-08-28T19:45:00Z'}])}
    if(path==='/rest/v1/rpc/admin_certificate_roster')return json(route,state.certificateIssued?[{certificate_id:IDS.certificate,user_id:IDS.user,student_name:'Aluno QA',email:'qa@lc.invalid',course_id:IDS.course,course_title:'Lógica de Programação Básica',verification_code:'LC-ADMIN-2026',issued_at:'2026-08-28T19:45:00Z'}]:[]);
    if(path==='/rest/v1/rpc/admin_donation_roster')return json(route,[{donation_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',donor_name:'Apoiador QA',payer_email:'apoio@lc.invalid',amount:20,status:'approved',provider:'pix_direct',payment_method:'pix',approved_at:'2026-08-29T10:00:00Z',created_at:'2026-08-29T10:00:00Z',public_listing:false,message:null}]);
    if(path==='/rest/v1/rpc/admin_register_manual_donation')return json(route,[{donation_id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',supporter_id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',amount:20,status:'approved',approved_at:'2026-08-29T11:00:00Z'}]);
    if(path==='/rest/v1/rpc/admin_audit_feed')return json(route,[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',actor_id:IDS.user,actor_name:'Administrador QA',action:'profile_update',target_type:'profile',target_id:IDS.user,details:{},created_at:'2026-08-28T17:00:00Z'}]);
    if(path==='/rest/v1/rpc/review_project_submission')return json(route,[{submission_id:IDS.submission,status:'approved',score:90,feedback:'Bom trabalho.',reviewed_at:'2026-08-28T18:00:00Z'}]);

    if(path==='/rest/v1/rpc/admin_analytics_overview')return json(route,[{window_days:30,instrumented_since:'2026-08-28T18:00:00Z',events:154,sessions:34,active_users:18,active_users_7d:12,lesson_opens:76,lesson_completions:51,avg_engagement_minutes:14.2,quiz_pass_rate:82.5,boss_submissions:7,certificates_issued:4,mobile_share:68.4}]);
    if(path==='/rest/v1/rpc/admin_analytics_funnel')return json(route,[
      {stage:'Cadastro iniciado',stage_order:1,people:30},{stage:'Acesso autenticado',stage_order:2,people:26},{stage:'Diagnóstico concluído',stage_order:3,people:20},{stage:'Curso aberto',stage_order:4,people:19},{stage:'Aula aberta',stage_order:5,people:18},{stage:'Aula concluída',stage_order:6,people:14},{stage:'Boss Fight enviada',stage_order:7,people:7},{stage:'Certificado emitido',stage_order:8,people:4}
    ]);
    if(path==='/rest/v1/rpc/admin_analytics_daily')return json(route,[
      {day:'2026-08-25',active_users:7,sessions:9,events:31,lesson_opens:15,lesson_completions:9,engagement_minutes:93},
      {day:'2026-08-26',active_users:9,sessions:12,events:44,lesson_opens:21,lesson_completions:14,engagement_minutes:127},
      {day:'2026-08-27',active_users:11,sessions:13,events:52,lesson_opens:24,lesson_completions:18,engagement_minutes:169}
    ]);
    if(path==='/rest/v1/rpc/admin_analytics_courses')return json(route,[{course_id:IDS.course,course_title:'Lógica de Programação Básica',enrollments:12,active_learners:9,course_opens:19,lesson_opens:45,lesson_completions:31,avg_quiz_score:87.5,quiz_pass_rate:83.3,boss_submissions:5,certificates:3,engagement_minutes:286}]);
    if(path==='/rest/v1/rpc/admin_analytics_lessons')return json(route,[{lesson_id:IDS.lesson,module_title:'Pensar antes de programar',lesson_title:'O que é programar',lesson_position:1,opens:18,unique_learners:12,completions:14,completion_from_opens:77.8,avg_engagement_seconds:820,avg_scroll_percent:89,inline_checks:16,inline_correct_rate:81.3,lab_completions:13}]);
    if(path==='/rest/v1/rpc/admin_analytics_devices')return json(route,[{device_type:'mobile',sessions:23,active_users:13,events:110},{device_type:'desktop',sessions:11,active_users:8,events:44}]);
    if(path==='/rest/v1/rpc/admin_analytics_goals')return json(route,[{goal:'primeiro_emprego',learners:8,avg_diagnostic_score:3.8,mastered:2,recommended:4,strongly_recommended:2},{goal:'web',learners:5,avg_diagnostic_score:4.2,mastered:2,recommended:2,strongly_recommended:1}]);

    return json(route,[]);
  });
  return state;
}
