# Policy smoke tests

Quick manual checks to prove RLS denies actions for the wrong role.

Assumptions:
- You have run the profile table + RLS SQL.
- There exist at least:
  - One applicant user with `profile.role = 'applicant'` and linked `applicant_id`.
  - One recruiter user with `profile.role = 'recruiter'` and linked `company_id`.
- You know their email/password for testing.

## 1. Job insert/update

### 1.1 As applicant (should be denied)

SQL (run in SQL editor as the applicant via `auth.uid()` context or using the JS client):

```sql
insert into public.job (title, description, location, company_id)
values ('Should Fail', 'Applicant trying to post job', 'Remote', '<some-company-uuid>');
```

Expected: RLS denies insert because there is no `profile` row with `role = 'recruiter'` and matching `company_id`.

JS (Node/TS using `@supabase/supabase-js` as applicant):

```ts
const { data, error } = await supabase
  .from('job')
  .insert({ title: 'Should Fail', description: 'x', location: 'Remote', company_id: someCompanyId })

console.log('error should be non-null:', error)
```

### 1.2 As recruiter for wrong company (should be denied)

Use a recruiter whose `profile.company_id = recruiter_company_id` and try to post a job for a *different* company:

```sql
insert into public.job (title, description, location, company_id)
values ('Wrong company', 'Recruiter for other company', 'NYC', '<other-company-uuid>');
```

Expected: denied by policy, since `profile.company_id != job.company_id`.

### 1.3 As recruiter for own company (should succeed)

```sql
insert into public.job (title, description, location, company_id)
values ('Valid posting', 'Recruiter posting for own company', 'Remote', '<recruiter_company_id>');
```

Expected: insert succeeds.

## 2. Application insert

### 2.1 As applicant for own applicant_id (should succeed)

JS (logged in as applicant):

```ts
const { data: apps, error } = await supabase
  .from('application')
  .insert({ applicant_id, job_id, status: 'submitted' })

console.log('error should be null:', error)
```

Expected: succeeds when `profile.role = 'applicant'` and `profile.applicant_id = applicant_id`.

### 2.2 As applicant for someone else (should be denied)

Use a different `applicant_id` that does not match the current profile:

```ts
const { error } = await supabase
  .from('application')
  .insert({ applicant_id: otherApplicantId, job_id, status: 'submitted' })

console.log('error should be non-null:', error)
```

Expected: denied by `application_insert_applicant` policy.

### 2.3 As recruiter trying to apply (should be denied)

Logged in as recruiter:

```ts
const { error } = await supabase
  .from('application')
  .insert({ applicant_id, job_id, status: 'submitted' })

console.log('error should be non-null:', error)
```

Expected: denied, since there is no `profile` row with `role = 'applicant'` matching `applicant_id`.

## 3. Application status updates (recruiter only, by company)

Assume an existing application row `application_id = X`, associated with a job `job_id = J` and job.company_id = `companyA`.

### 3.1 Applicant attempting to update status (should be denied)

Logged in as applicant:

```ts
const { error } = await supabase
  .from('application')
  .update({ status: 'accepted' })
  .eq('application_id', X)

console.log('error should be non-null:', error)
```

Expected: denied, since `application_update_recruiter` only allows recruiters with matching company.

### 3.2 Recruiter for another company (should be denied)

Logged in as recruiter whose `profile.company_id = companyB` and `companyB != companyA`:

```ts
const { error } = await supabase
  .from('application')
  .update({ status: 'accepted' })
  .eq('application_id', X)

console.log('error should be non-null:', error)
```

Expected: denied, since joined `job.company_id` does not match recruiter profile.company_id.

### 3.3 Recruiter for owning company (should succeed)

Logged in as recruiter whose `profile.company_id = companyA`:

```ts
const { data, error } = await supabase
  .from('application')
  .update({ status: 'accepted' })
  .eq('application_id', X)
  .select('*')

console.log('error should be null, status should be updated:', { error, data })
```

Expected: update succeeds.

## 4. whoami() RPC

After creating the `whoami()` RPC, verify that:

```ts
const { data, error } = await supabase.rpc('whoami')
console.log({ data, error })
```

- As applicant, you get a single row with `{ user_id, role: 'applicant', applicant_id, company_id: null }`.
- As recruiter, you get `{ user_id, role: 'recruiter', applicant_id: null, company_id }`.
- As a user without a profile row, you get an empty array.
