# Role-based auth checklist

Manual test plan for role + RLS integration.

Assumptions:
- You have the `profile` table, RLS policies, and `whoami()` RPC deployed.
- Frontend is running against Supabase with the same schema.
- Use two separate browsers / profiles for applicant vs recruiter, or sign out between flows.

Notation:
- `supabase` below refers to an instance of `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` used in a Node/TS REPL or browser console.

---

## 1. Sign up as applicant

### 1.1 Frontend flow
1. Go to `/signup`.
2. Complete step 1 with email/password.
3. On step 2, choose **applicant**.
4. Finish.

Expected:
- Browser lands on `/applicant/dashboard`.
- Applications list loads (empty initially).

### 1.2 Backend verification

1. Fetch `whoami()` as the applicant:

```ts
const { data, error } = await supabase.rpc('whoami')
console.log({ data, error })
```

Expected:
- `data[0].role === 'applicant'`.
- `data[0].applicant_id` is a non-null UUID.
- `data[0].company_id === null`.

2. Inspect `profile` row directly (from SQL editor as service-role or with RLS disabled):

```sql
select * from public.profile where user_id = '<applicant_user_id>';
```

---

## 2. Sign up as recruiter

### 2.1 Frontend flow
1. Sign out of the applicant account.
2. Go to `/signup`.
3. Complete step 1 with a different email/password.
4. On step 2, choose **recruiter**.
5. If prompted, either select an existing company or let the app create "New Company".

Expected:
- Browser lands on `/company/dashboard`.
- Company dashboard shows at least one company card.

### 2.2 Backend verification

```ts
const { data, error } = await supabase.rpc('whoami')
console.log({ data, error })
```

Expected:
- `data[0].role === 'recruiter'`.
- `data[0].company_id` is non-null.
- `data[0].applicant_id === null`.

Check profile row from SQL (service-level):

```sql
select * from public.profile where user_id = '<recruiter_user_id>';
```

---

## 3. Applicant: can apply, cannot post

### 3.1 Can apply

Logged in as **applicant** in the browser:
1. Navigate to `/jobs`.
2. Open a job detail page.
3. Click **Apply Job**.

Expected:
- UI shows success message.
- In console/REPL:

```ts
const { data, error } = await supabase
  .from('application')
  .select('*')
  .order('date_applied', { ascending: false })

console.log({ data, error })
```

- `error === null`, and you see at least one row with `status === 'submitted'`.

### 3.2 Cannot post job (403)

Still logged in as applicant, use a REPL/console:

```ts
const { data, error, status } = await supabase
  .from('job')
  .insert({
    title: 'Applicant Should Fail',
    description: 'Trying to post as applicant',
    location: 'Remote',
    company_id: '00000000-0000-0000-0000-000000000000', // or any UUID
  })

console.log({ data, error, status })
```

Expected:
- `error` is non-null.
- `status` is `401` or `403`.
- Error message mentions RLS/permission denied.

---

## 4. Recruiter: can post/edit own jobs, cannot apply

### 4.1 Can post job for own company

Logged in as **recruiter**:

```ts
const { data: who } = await supabase.rpc('whoami')
const companyId = who?.[0]?.company_id

const { data, error, status } = await supabase
  .from('job')
  .insert({
    title: 'Recruiter Valid Posting',
    description: 'Posted by recruiter for own company',
    location: 'Remote',
    company_id: companyId,
  })
  .select('*')

console.log({ data, error, status })
```

Expected:
- `error === null`.
- Inserted job row has `company_id === companyId`.

### 4.2 Cannot apply to a job (403)

With the same recruiter session:

```ts
const someApplicantId = '00000000-0000-0000-0000-000000000000' // any UUID
const { data, error, status } = await supabase
  .from('application')
  .insert({ applicant_id: someApplicantId, job_id: '<some-job-uuid>', status: 'submitted' })

console.log({ data, error, status })
```

Expected:
- `error` non-null.
- `status` `401` or `403`.
- Message indicates permission denied by RLS.

---

## 5. Recruiter A cannot edit Recruiter B’s job

Goal: prove company-scoped RLS on `job` and `application`.

### 5.1 Setup: create a job as Recruiter B

Logged in as **Recruiter B**:

```ts
const { data: whoB } = await supabase.rpc('whoami')
const companyB = whoB?.[0]?.company_id

const { data: jobB, error: jobErr } = await supabase
  .from('job')
  .insert({
    title: 'Recruiter B Job',
    description: 'Owned by B',
    location: 'Remote',
    company_id: companyB,
  })
  .select('*')
  .single()

console.log({ jobB, jobErr })
```

Expected: `jobErr === null` and `jobB.company_id === companyB`.

### 5.2 Recruiter A tries to update Recruiter B’s job

Logged in as **Recruiter A**:

```ts
const { data, error, status } = await supabase
  .from('job')
  .update({ title: 'Hacked by A' })
  .eq('job_id', '<jobB.job_id here>')

console.log({ data, error, status })
```

Expected:
- `error` non-null.
- `status` `401` or `403`.
- Job title in DB remains unchanged.

Same idea for applications:

```ts
const { data: apps, error: appErr } = await supabase
  .from('application')
  .update({ status: 'accepted' })
  .eq('job_id', '<jobB.job_id here>')

console.log({ apps, appErr })
```

Expected: denied unless Recruiter A’s `profile.company_id` matches the job’s `company_id`.

---

## 6. Unauthenticated user can only view jobs

Sign out (or use an incognito window with no Supabase auth cookie).

### 6.1 Can list jobs

```ts
const { data, error, status } = await supabase
  .from('job')
  .select('job_id, title, location')
  .limit(5)

console.log({ data, error, status })
```

Expected:
- `error === null`.
- Some public jobs listed.

### 6.2 Cannot insert job or application

```ts
const { error: insJobErr, status: insJobStatus } = await supabase
  .from('job')
  .insert({
    title: 'Anon Insert',
    description: 'Should fail',
    location: 'Nowhere',
    company_id: '00000000-0000-0000-0000-000000000000',
  })

console.log({ insJobErr, insJobStatus })

const { error: insAppErr, status: insAppStatus } = await supabase
  .from('application')
  .insert({ applicant_id: '00000000-0000-0000-0000-000000000000', job_id: '00000000-0000-0000-0000-000000000000', status: 'submitted' })

console.log({ insAppErr, insAppStatus })
```

Expected:
- Both inserts fail with `401` or `403` and RLS/permission denied errors.

---

If all of the above expectations hold, your UI and RLS policies are working together: no user can reach or successfully use a resource they are not authorized for, even via direct API calls.
