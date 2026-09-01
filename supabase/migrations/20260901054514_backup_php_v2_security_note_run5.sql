create table if not exists nexora_private.php_v2_security_note_backup_20260901_run5 as
select l.*
from nexora.lessons l
join nexora.modules m on m.id=l.module_id
join nexora.courses c on c.id=m.course_id
where c.status='published' and l.status='published' and m.title='Programação PHP V2'
  and (lower(l.content::text) like '%@$_%' or lower(l.content::text) like '%$_request[%' or lower(l.content::text) like '%where idcat=''$idcat''%' or lower(l.content::text) like '%where idpro=''$idpro''%' or lower(l.content::text) like '%where idcarrinho=''$idcarrinho''%');
revoke all on nexora_private.php_v2_security_note_backup_20260901_run5 from public,anon,authenticated;
grant all on nexora_private.php_v2_security_note_backup_20260901_run5 to service_role;
