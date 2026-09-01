-- LC Pro commerce foundation
-- Applied to production as Supabase migration 20260901115123_lc_pro_commerce_foundation.

alter table nexora.courses
  add column if not exists access_tier text not null default 'free',
  add column if not exists certificate_type text not null default 'standard';

do $$
begin
  if not exists (select 1 from pg_constraint where conname='courses_access_tier_check' and conrelid='nexora.courses'::regclass) then
    alter table nexora.courses add constraint courses_access_tier_check check (access_tier in ('free','pro'));
  end if;
  if not exists (select 1 from pg_constraint where conname='courses_certificate_type_check' and conrelid='nexora.courses'::regclass) then
    alter table nexora.courses add constraint courses_certificate_type_check check (certificate_type in ('standard','professional_pro'));
  end if;
end $$;

create table if not exists nexora.commerce_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  product_type text not null default 'formation',
  currency text not null default 'BRL',
  list_price_cents integer not null,
  current_price_cents integer not null,
  affiliate_commission_bps integer not null default 4000,
  sales_status text not null default 'draft',
  checkout_provider text not null default 'mercadopago',
  curriculum jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_products_prices_check check (list_price_cents>0 and current_price_cents>0 and current_price_cents<=list_price_cents),
  constraint commerce_products_commission_check check (affiliate_commission_bps between 0 and 10000),
  constraint commerce_products_status_check check (sales_status in ('draft','coming_soon','active','paused','archived')),
  constraint commerce_products_type_check check (product_type in ('formation','course','bundle','pass'))
);

create table if not exists nexora.commerce_product_courses (
  product_id uuid not null references nexora.commerce_products(id) on delete cascade,
  course_id uuid not null references nexora.courses(id) on delete cascade,
  position integer not null default 1,
  primary key(product_id,course_id)
);

create table if not exists nexora.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references nexora.commerce_products(id),
  amount_cents integer not null,
  currency text not null default 'BRL',
  provider text not null default 'mercadopago',
  provider_preference_id text,
  provider_payment_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint commerce_orders_status_check check (status in ('pending','paid','rejected','cancelled','refunded','chargeback')),
  constraint commerce_orders_amount_check check (amount_cents>0)
);
create unique index if not exists commerce_orders_provider_payment_uidx on nexora.commerce_orders(provider,provider_payment_id) where provider_payment_id is not null;
create index if not exists commerce_orders_user_idx on nexora.commerce_orders(user_id,created_at desc);
create index if not exists commerce_orders_product_idx on nexora.commerce_orders(product_id,status);

create table if not exists nexora.course_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references nexora.courses(id) on delete cascade,
  product_id uuid references nexora.commerce_products(id) on delete set null,
  order_id uuid references nexora.commerce_orders(id) on delete set null,
  source text not null default 'purchase',
  status text not null default 'active',
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique(user_id,course_id),
  constraint course_entitlements_source_check check (source in ('purchase','admin','bundle','pass','migration')),
  constraint course_entitlements_status_check check (status in ('active','revoked','expired'))
);
create index if not exists course_entitlements_user_idx on nexora.course_entitlements(user_id,status);
create index if not exists course_entitlements_course_idx on nexora.course_entitlements(course_id,status);

alter table nexora.commerce_products enable row level security;
alter table nexora.commerce_product_courses enable row level security;
alter table nexora.commerce_orders enable row level security;
alter table nexora.course_entitlements enable row level security;

drop policy if exists commerce_products_catalog_select on nexora.commerce_products;
create policy commerce_products_catalog_select on nexora.commerce_products for select to anon,authenticated using (sales_status in ('coming_soon','active'));
drop policy if exists commerce_product_courses_catalog_select on nexora.commerce_product_courses;
create policy commerce_product_courses_catalog_select on nexora.commerce_product_courses for select to authenticated using (true);
drop policy if exists commerce_orders_self_select on nexora.commerce_orders;
create policy commerce_orders_self_select on nexora.commerce_orders for select to authenticated using ((select auth.uid())=user_id or (select nexora_private.is_admin()));
drop policy if exists course_entitlements_self_select on nexora.course_entitlements;
create policy course_entitlements_self_select on nexora.course_entitlements for select to authenticated using ((select auth.uid())=user_id or (select nexora_private.is_admin()));

grant select on nexora.commerce_products to anon,authenticated;
grant select on nexora.commerce_product_courses,nexora.commerce_orders,nexora.course_entitlements to authenticated;
grant all on nexora.commerce_products,nexora.commerce_product_courses,nexora.commerce_orders,nexora.course_entitlements to service_role;

create or replace function nexora.auto_enroll_free_courses()
returns trigger language plpgsql security definer set search_path='nexora','public'
as $$
begin
  insert into nexora.enrollments(user_id,course_id,status,enrolled_at)
  select new.id,c.id,'active',now() from nexora.courses c
  where c.status='published' and c.access_tier='free'
  on conflict(user_id,course_id) do update
    set status=case when nexora.enrollments.status='completed' then nexora.enrollments.status else 'active' end;
  return new;
end $$;

create or replace function nexora.claim_free_course(p_course_id uuid)
returns jsonb language plpgsql security definer set search_path='nexora','public','auth'
as $$
declare uid uuid:=auth.uid(); v_enrollment nexora.enrollments%rowtype;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if not nexora_private.is_member() then raise exception 'member_required'; end if;
  if not exists(select 1 from nexora.courses where id=p_course_id and status='published' and access_tier='free') then
    raise exception 'free_course_not_available';
  end if;
  insert into nexora.enrollments(user_id,course_id,status,enrolled_at)
  values(uid,p_course_id,'active',now())
  on conflict(user_id,course_id) do update
    set status=case when nexora.enrollments.status='completed' then nexora.enrollments.status else 'active' end,
        completed_at=case when nexora.enrollments.status='completed' then nexora.enrollments.completed_at else null end
  returning * into v_enrollment;
  return jsonb_build_object('course_id',v_enrollment.course_id,'status',v_enrollment.status);
end $$;
revoke all on function nexora.claim_free_course(uuid) from public,anon;
grant execute on function nexora.claim_free_course(uuid) to authenticated,service_role;

create or replace function nexora.catalog_courses()
returns table(
  id uuid,slug text,title text,description text,minimum_score numeric,course_position integer,
  course_type text,level_label text,category_label text,is_recommended_start boolean,recommendation_note text,
  access_tier text,certificate_type text,module_count bigint,lesson_count bigint,estimated_minutes bigint,xp_total bigint,
  completed_lessons bigint,progress_pct integer,is_enrolled boolean
)
language sql security definer set search_path='nexora','public','auth' stable
as $$
  select c.id,c.slug,c.title,c.description,c.minimum_score,c.position,c.course_type,c.level_label,c.category_label,c.is_recommended_start,
         c.recommendation_note,c.access_tier,c.certificate_type,
         (select count(*) from nexora.modules m where m.course_id=c.id),
         (select count(*) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),
         coalesce((select sum(l.estimated_minutes) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),0),
         coalesce((select sum(l.xp_reward) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),0),
         (select count(*) from nexora.lesson_progress lp join nexora.lessons l on l.id=lp.lesson_id join nexora.modules m on m.id=l.module_id where m.course_id=c.id and lp.user_id=auth.uid() and lp.progress>=100),
         case when (select count(*) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published')=0 then 0
              else round(100.0*(select count(*) from nexora.lesson_progress lp join nexora.lessons l on l.id=lp.lesson_id join nexora.modules m on m.id=l.module_id where m.course_id=c.id and lp.user_id=auth.uid() and lp.progress>=100)/(select count(*) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'))::integer end,
         exists(select 1 from nexora.enrollments e where e.user_id=auth.uid() and e.course_id=c.id and e.status in ('active','completed'))
  from nexora.courses c
  where auth.uid() is not null and nexora_private.is_member() and c.status='published'
    and (c.access_tier='free' or exists(select 1 from nexora.enrollments e where e.user_id=auth.uid() and e.course_id=c.id and e.status in ('active','completed')) or nexora_private.is_admin())
  order by c.position,c.title;
$$;
revoke all on function nexora.catalog_courses() from public,anon;
grant execute on function nexora.catalog_courses() to authenticated,service_role;

create or replace function nexora_private.grant_paid_course_entitlement(p_user_id uuid,p_product_id uuid,p_order_id uuid)
returns integer language plpgsql security invoker set search_path=''
as $$
declare v_count integer:=0;
begin
  if not exists(select 1 from nexora.commerce_orders o where o.id=p_order_id and o.user_id=p_user_id and o.product_id=p_product_id and o.status='paid') then
    raise exception 'paid_order_required';
  end if;
  insert into nexora.course_entitlements(user_id,course_id,product_id,order_id,source,status,granted_at)
  select p_user_id,pc.course_id,p_product_id,p_order_id,'purchase','active',now()
  from nexora.commerce_product_courses pc where pc.product_id=p_product_id
  on conflict(user_id,course_id) do update set product_id=excluded.product_id,order_id=excluded.order_id,status='active',source='purchase',granted_at=now(),expires_at=null,revoked_at=null;
  insert into nexora.enrollments(user_id,course_id,status,enrolled_at)
  select p_user_id,pc.course_id,'active',now()
  from nexora.commerce_product_courses pc join nexora.courses c on c.id=pc.course_id
  where pc.product_id=p_product_id and c.status='published' and c.access_tier='pro'
  on conflict(user_id,course_id) do update set status=case when nexora.enrollments.status='completed' then 'completed' else 'active' end;
  get diagnostics v_count=row_count;
  return v_count;
end $$;
revoke all on function nexora_private.grant_paid_course_entitlement(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function nexora_private.grant_paid_course_entitlement(uuid,uuid,uuid) to service_role;

insert into nexora.enrollments(user_id,course_id,status,enrolled_at)
select p.id,c.id,'active',now() from nexora.profiles p cross join nexora.courses c
where p.status<>'blocked' and c.status='published' and c.access_tier='free'
on conflict(user_id,course_id) do nothing;

insert into nexora.courses(slug,title,description,status,minimum_score,position,course_type,level_label,category_label,is_recommended_start,recommendation_note,access_tier,certificate_type)
values('lc-pro-programador-full-stack','Programador Full Stack Pro','Formação profissional integrada para construir aplicações completas, do frontend ao deploy, com projetos de portfólio e projeto final.','draft',70,900,'formation','Profissional Pro','Programação',false,'Recomendado após dominar fundamentos de lógica e Web.','pro','professional_pro')
on conflict(slug) do update set title=excluded.title,description=excluded.description,course_type=excluded.course_type,level_label=excluded.level_label,category_label=excluded.category_label,access_tier='pro',certificate_type='professional_pro',updated_at=now();

with c as (select id from nexora.courses where slug='lc-pro-programador-full-stack'),
seed(module_position,title,description) as (values
(1,'Fundamentos de Engenharia Web','Ambiente profissional, Git, arquitetura Web e critérios de qualidade antes de construir o produto.'),
(2,'Frontend Profissional','HTML semântico, CSS responsivo, acessibilidade, componentes e experiência de interface.'),
(3,'JavaScript Aplicado','Estado, eventos, módulos, consumo de APIs, tratamento de erros e organização de código.'),
(4,'Backend e APIs','HTTP, REST, contratos, validação, autenticação e regras de negócio no servidor.'),
(5,'Banco de Dados e SQL','Modelagem relacional, consultas, integridade, índices, transações e migrações.'),
(6,'Autenticação e Segurança','Sessões, autorização, proteção de segredos, OWASP, RLS e princípio do menor privilégio.'),
(7,'Integração Full Stack','Frontend, API e banco trabalhando como um único produto com estados de loading, erro e sucesso.'),
(8,'Testes e Qualidade','Testes, depuração, observabilidade, revisão de código e critérios de aceite.'),
(9,'Deploy e Produção','Variáveis de ambiente, CI/CD, domínio, logs, rollback e operação segura.'),
(10,'Portfólio e Projeto Final','Projeto Full Stack integrador, documentação, README, apresentação e publicação no portfólio.'))
insert into nexora.modules(course_id,title,description,position)
select c.id,s.title,s.description,s.module_position from c cross join seed s
where not exists(select 1 from nexora.modules m where m.course_id=c.id and m.position=s.module_position);

insert into nexora.course_completion_rules(course_id,minimum_lesson_progress,minimum_assessment_score,require_all_module_assessments,require_final_assessment,require_final_project,minimum_project_score,certificate_enabled,updated_at)
select id,100,70,true,true,true,70,true,now() from nexora.courses where slug='lc-pro-programador-full-stack'
on conflict(course_id) do update set minimum_lesson_progress=100,minimum_assessment_score=70,require_all_module_assessments=true,require_final_assessment=true,require_final_project=true,minimum_project_score=70,certificate_enabled=true,updated_at=now();

insert into nexora.commerce_products(slug,title,description,product_type,currency,list_price_cents,current_price_cents,affiliate_commission_bps,sales_status,checkout_provider,curriculum,features,metadata)
values('programador-full-stack-pro','LC Pro — Programador Full Stack','Formação profissional com trilha integrada, projetos de portfólio, checkpoints e projeto final Full Stack.','formation','BRL',49700,29700,4000,'coming_soon','mercadopago',
'["Fundamentos de Engenharia Web","Frontend Profissional","JavaScript Aplicado","Backend e APIs","Banco de Dados e SQL","Autenticação e Segurança","Integração Full Stack","Testes e Qualidade","Deploy e Produção","Portfólio e Projeto Final"]'::jsonb,
'["Trilha profissional integrada","Projetos reais para portfólio","Checkpoints por etapa","Projeto final integrador","Certificado LC Pro mediante aprovação","Acesso permanente à formação adquirida"]'::jsonb,
'{"launch_price":297,"full_price":497,"price_floor":197,"affiliate_commission_percent":40,"access":"lifetime"}'::jsonb)
on conflict(slug) do update set title=excluded.title,description=excluded.description,list_price_cents=excluded.list_price_cents,current_price_cents=excluded.current_price_cents,affiliate_commission_bps=excluded.affiliate_commission_bps,curriculum=excluded.curriculum,features=excluded.features,metadata=excluded.metadata,updated_at=now();

insert into nexora.commerce_product_courses(product_id,course_id,position)
select p.id,c.id,1 from nexora.commerce_products p join nexora.courses c on c.slug='lc-pro-programador-full-stack'
where p.slug='programador-full-stack-pro'
on conflict(product_id,course_id) do update set position=excluded.position;
