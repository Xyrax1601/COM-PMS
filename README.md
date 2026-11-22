# COM-PMS (College of Medicine Patient Management System)

A centralized, modular-based patient information management and healthcare monitoring platform designed for the **College of Medicine**.

Inspired by the visual design system of **MongoDB Atlas & Data Explorer**, COM-PMS provides an enterprise database management experience tailored to clinical operations, patient registries, First Patient Encounters (FPE), consultations, laboratory orders, medications, follow-up monitoring, and Philippine Data Privacy Act compliance.

---

## 🏛️ System Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express.js (REST API, TypeScript)
- **Database**: MongoDB (Auto-provisioned persistent engine with WiredTiger storage + Mongoose ODM)
- **Excel Processing**: SheetJS (XLSX) with automatic normalization of Excel date serials, scientific notation numbers, and cross-sheet reconciliation
- **Authentication**: JWT with bcrypt password hashing and Role-Based Access Control (RBAC)

---

## 📊 Default User Accounts & Roles

The system comes pre-seeded with 4 standard staff roles (with 1-click persona switching on the login screen):

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Administrator** | `admin@compms.edu` | `Admin@123` | Full access: User management, patient records, deletion, audit logs |
| **Medical Staff** | `medical@compms.edu` | `Medical@123` | FPE recording, consultations, laboratory requests, medications, follow-ups |
| **Registration Staff** | `registration@compms.edu` | `Reg@123` | Patient registration, PhilHealth details, demographic updates |
| **Viewer / Auditor** | `viewer@compms.edu` | `Viewer@123` | Read-only access to dashboards, reports, and activity compliance trails |

---

## 🚀 Quick Start Instructions

### Starting the Application:

Double-click `start.bat` or run:
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
cd server
node dist/index.js
```

Open your browser to:
**`http://localhost:5000`**

---

## 📦 Ingested Patient Dataset (Sheet 1)

The system is hydrated with all **90 patients from Sheet 1** of `PROFILE DATA 2026.xlsx`:
- **Initial Seed Dataset**: Hydrated directly from `PROFILE DATA 2026.xlsx` with all **90 patients from Sheet 1** plus the unregistered encounter patient from `FPE BUT NOT REGISTERED` (`COM-2026-00001` through `COM-2026-00091`):
- **Total Patients**: 91
- **Total FPE Records**: 76
- **Total Consultations**: 74
- **Total Laboratory Orders**: 145
- **Total Medication Records**: 36
- **Total Follow-Up Appointments**: 6
- **Automated Lifecycle Breakdown**:
  - `Registered and Completed FPE and Consultation`: **52**
  - `Completed FPE but No Consultation`: **23**
  - `Registered but No FPE`: **15**
  - `Completed FPE but Not Registered`: **1** (`KHOBUNTIN, JONATHAN MABAYLAN`)
  - **Sum**: 91 (100% accounted for)

---

## 📋 Primary Modules

1. **Dashboard Module**:
   - Total Registered Patients, Completed FPE, Completed Consultations.
   - Real-time counters: Registered but No FPE, FPE but No Consultation, FPE but Not Registered.
   - Interactive monthly intake trends and comparison charts.
   - Upcoming & overdue follow-up counters.

2. **Patient Directory & Document View**:
   - Institutional ID generation (`COM-2026-00001`).
   - Standard PhilHealth formatting (`XX-XXXXXXXXX-X`).
   - Document-inspector profile containing Demographics, FPE, Consultations, Labs, Meds, Follow-ups, and Audit Logs.

3. **Patient Monitoring Module** *(Section III.H)*:
   - Automated categorization based on actual database relations (with dedicated monitoring cards):
     - *Registered and Completed FPE and Consultation*
     - *Registered but No FPE*
     - *Completed FPE but No Consultation*
     - *Completed FPE but Not Registered*
     - *FPE and Consultation but not registered* (Completed clinical encounters but pending PhilHealth)
     - *Pending Follow-ups*
   - **"Manually set Patient Status" Feature**:
     - Functional button on patient registration & editing modals.
     - Interactive checklist modal allowing staff to check off completed patient processes:
       - `[ ] PhilHealth Registration Verified`
       - `[ ] First Patient Encounter (FPE) Completed`
       - `[ ] Clinical Consultation Completed`
     - Displays a real-time live preview of the concluded status.
     - Automatically creates corresponding baseline clinical encounter records (FPE & Consultation) on save while preserving full automated lifecycle continuity.

4. **Clinical Modules**:
   - **FPE Management**: First Patient Encounter date, vital signs (BP, HR, RR, Temp), notes.
   - **Consultation Management**: Attending physician, clinical remarks, recommendations.
   - **Laboratory Management**: Test names (FBS, CBC, Lipid Profile, Urinalysis, ECG, Chest X-Ray), request dates, status, results.
   - **Medication Management**: Medicines (Paracetamol, Betahistine, Loratadine, etc.), dosages, frequencies.
   - **Follow-up Monitoring**: Scheduled return visits, overdue alerting, completion tracking.

5. **Reports & Analytics**:
   - Daily, Monthly, Annual reports.
   - FPE and Consultation Accomplishment reports.
   - Incomplete Processes reports.
   - PhilHealth Monitoring reports.
   - Printable view with official **College of Medicine Letterhead** & certification blocks.
   - Direct Excel (`.xlsx`) export.

6. **Excel Integration Hub**:
   - Live staging preview before saving.
   - Conflict & duplicate detection.
   - One-click comprehensive multi-sheet workbook export.

7. **User Management & Audit Trails**:
   - Role management (Admin, Medical, Registration, Viewer).
   - Immutable activity audit logs capturing timestamps, operator identity, IP addresses, and document payloads.
