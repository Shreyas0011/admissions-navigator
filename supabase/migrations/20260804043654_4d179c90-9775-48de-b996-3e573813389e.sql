insert into public.profiles (id, email, full_name)
values ('335c4ee4-4930-46c4-ad6e-bf44ff5980c6', 'shreyas.777999@gmail.com', 'Shreyas')
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
values ('335c4ee4-4930-46c4-ad6e-bf44ff5980c6', 'super_admin')
on conflict (user_id, role) do nothing;