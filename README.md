# 🌐 Job Application Portal Management System

A **full-stack web application** built with **React.js** (frontend) and **Supabase (PostgreSQL + Auth)** for managing job postings, applications, and candidate profiles.  
This project streamlines the recruitment process for both **applicants** and **companies** through modern UI and AI-powered analytics.

---

## 🚀 Tech Stack

| Layer | Technology |
|:--|:--|
| **Frontend** | React.js (Vite), TailwindCSS, Recharts |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Language** | JavaScript (ES6+) |
| **Deployment** | Vercel / Netlify (Frontend), Supabase Cloud (Backend) |
| **Version Control** | Git + GitHub |

---

## 🎯 Key Features

### 👩‍💼 Applicant Dashboard
- Browse jobs and apply directly from the portal  
- Edit personal profile, upload resume, and manage skills  
- View application statuses in real-time  

### 🏢 Company Dashboard
- Post new jobs with detailed requirements  
- View and filter applicants per job  
- Access analytics dashboard (built with Recharts)  

### 💡 Advanced Features (Creative Additions)
1. **AI-Powered Job Matching Engine**
   - Recommends jobs to applicants based on **skill overlap** using cosine similarity scoring.
   - Dynamically ranks postings with highest match percentage.
2. **Interactive Analytics Dashboard**
   - Displays **applicant distribution**, **popular skills**, and **job performance metrics** with Recharts.
   - Recruiters can gain insights into skill trends and job engagement.

---

## 🧩 Database Schema Overview

### 🗂️ Core Entities
- **Company(CompanyID, Name, Industry, Location)**
- **Job(JobID, Title, Description, Requirements, Salary, Location, CompanyID)**
- **Applicant(ApplicantID, Name, Email, Resume)**
- **Skill(SkillID, SkillName)**

### ⚙️ Relationship Tables
- **ApplicantSkill(ApplicantID, SkillID, ProficiencyLevel)** – Weak entity  
- **JobSkill(JobID, SkillID)** – Weak entity  
- **Application(ApplicationID, ApplicantID, JobID, DateApplied, Status)** – Associative entity  

All tables use foreign keys with `ON DELETE CASCADE`, ensuring referential integrity.  
Supabase RLS (Row-Level Security) enforces per-user access control for applicants and recruiters.

---

## 📈 Project Milestones (Progress Summary)

| Milestone | Status | Description |
|:--|:--:|:--|
| Supabase setup + schema | ✅ | Database and tables fully implemented |
| Frontend setup + auth | ✅ | React + Supabase Auth integrated |
| Job posting & apply features | ✅ | Applicants and companies tested successfully |
| Skill-based recommendations | ⚙️ In progress | Matching algorithm working with sample data |
| Analytics dashboard | ⚙️ In progress | Recharts integrated, sample visualizations active |
| UI polish (glass theme) | ✅ | Fully responsive and modern design |
| Final documentation & demo | 🕓 | In preparation |

---

## 🧠 How to Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/AreebEhsan/job-application-portal.git
   cd job-application-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   App will be live at [http://localhost:5173](http://localhost:5173)

---

## 🧾 Example `.env.local`
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
```

---

- 🏠 Home Page  
- 💼 Job Listings  
- 📄 Application Form  
- 📊 Analytics Dashboard  

---



## 📅 Timeline & Status
**Current Stage:** Mid-Project (Stage 4)  
**On Schedule:** Yes — all core features completed, advanced functions in progress.  
**Next Steps:** Finalize analytics visualizations & prepare demo video.  

---

## 🏁 License
This project is open-source and licensed under the [MIT License](LICENSE).

---

> ✨ *“Bringing clarity and efficiency to job applications — one line of code at a time.”*

© 2025 Areeb Ehsan
