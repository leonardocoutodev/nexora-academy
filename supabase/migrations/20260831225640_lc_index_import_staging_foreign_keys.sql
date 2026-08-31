create index if not exists ouro_assessment_bindings_lc_module_id_idx
  on nexora.ouro_assessment_bindings(lc_module_id);
create index if not exists ouro_lesson_hydration_backups_lc_lesson_id_idx
  on nexora.ouro_lesson_hydration_backups(lc_lesson_id);
create index if not exists ouro_source_formation_modules_lc_module_id_idx
  on nexora.ouro_source_formation_modules(lc_module_id);
create index if not exists ouro_source_formations_lc_course_id_idx
  on nexora.ouro_source_formations(lc_course_id);
create index if not exists ouro_source_free_courses_lc_course_id_idx
  on nexora.ouro_source_free_courses(lc_course_id);
create index if not exists ouro_source_free_courses_source_course_id_idx
  on nexora.ouro_source_free_courses(source_course_id);
