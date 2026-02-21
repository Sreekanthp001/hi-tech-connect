

# Hi-Tech Communication Systems – Service Management Platform

## Overview
A premium, enterprise-grade service management platform for Hi-Tech Communication Systems, a 28-year-old security solutions company in Nellore. The design will follow a corporate SaaS aesthetic with a deep blue primary color, clean white backgrounds, and professional typography.

---

## Phase 1: Foundation & Landing Page

### Design System
- Deep blue primary (`#1e3a5f`), white backgrounds, subtle gray sections (`#f8f9fa`)
- Professional sans-serif typography, clean card layouts, smooth hover transitions

### Landing Page
- **Hero Section**: Bold headline with CTA buttons ("Request New Connection" & "Raise Complaint")
- **About Company**: 28 years of trusted service story
- **Products Section**: Pricing cards for CCTV, PTZ, Turbo HD, 4K Smart, Philips Smart Cameras, Attendance Recorders
- **Services Section**: Installation, maintenance, support overview
- **Why Choose Us**: Trust indicators, stats, differentiators
- **Customer Reviews**: Testimonial cards
- **Header**: Logo, navigation, Login/Register button

---

## Phase 2: Authentication Pages

- **Login Page**: Email/password form with role indicator (Admin/Worker/Client)
- **Register Page**: Name, email, phone, password, role selection
- Role-based routing after login (redirects to appropriate dashboard)
- *Note: Initially UI-only with mock auth; backend integration can be added later with Lovable Cloud*

---

## Phase 3: Client Dashboard

- **Sidebar Navigation**: Dashboard, Request Installation, Raise Complaint, My Requests, My Complaints, Profile, Reviews
- **Dashboard Widgets**: Total Requests, Pending, In Progress, Completed (stat cards)
- **Service History Timeline**: Visual timeline of past services
- **New Installation Request Form**: Product type, address, details
- **Complaint Form**: Issue title, description, product type, address, submit
- **My Requests & Complaints**: Filterable list views with status badges

---

## Phase 4: Admin Dashboard

- **Sidebar Navigation**: Dashboard, All Clients, Workers, Installation Requests, Complaints, Assign Work, Reports, Reviews
- **Dashboard Widgets**: Total Clients, Active Tickets, Pending Assignments, Completed This Month
- **Charts**: Worker Performance bar chart, Client Approach Count trend chart (using Recharts)
- **Client & Worker Management**: Table views with search/filter
- **Assignment UI**: Select worker dropdown, set priority, assign button
- **Reports Page**: Visual analytics with charts

---

## Phase 5: Worker Dashboard

- **Sidebar Navigation**: My Assigned Tasks, Completed Tasks, Profile
- **Dashboard Widgets**: Assigned Tasks Count, Completed This Month, New Tasks
- **Task List**: Cards showing client name, address, issue summary, priority badge
- **Task Detail Page**: Full client info, issue details, status dropdown (Pending → In Progress → Completed), assistant name field, update button

---

## Technical Notes
- All pages fully responsive (mobile + desktop)
- Role-based routing with React Router
- Mock data for all dashboards initially
- Recharts for analytics/charts
- Sidebar using shadcn/ui Sidebar component
- Backend (auth, database) can be added later with Lovable Cloud when ready to go live

