CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    middle_name,
    last_name,
    job_title,
    organization,
    location,
    phone_number,
    linkedin_url,
    orcid_url,
    website_url,
    bio
  )
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'middle_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'job_title',
    new.raw_user_meta_data ->> 'organization',
    new.raw_user_meta_data ->> 'location',
    new.raw_user_meta_data ->> 'phone_number',
    new.raw_user_meta_data ->> 'linkedin_url',
    new.raw_user_meta_data ->> 'orcid_url',
    new.raw_user_meta_data ->> 'website_url',
    new.raw_user_meta_data ->> 'bio'
  );
  RETURN new;
END;
$$;