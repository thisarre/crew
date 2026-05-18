-- À PERSONNALISER avec ton nom d'église réel
insert into organizations (name, slug, greeting_style)
values ('Mon Église', 'mon-eglise', 'warm');

do $$
declare org_id uuid;
begin
  select id into org_id from organizations where slug = 'mon-eglise';

  insert into skills (organization_id, name, icon, display_order) values
    (org_id, 'Sono', '🎚️', 1),
    (org_id, 'Caméra', '🎥', 2),
    (org_id, 'Diffusion', '📺', 3);
end $$;
