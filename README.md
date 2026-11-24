# Taskboard

A Kanban task board built with React, Vite and Supabase. Each visitor gets a private guest
account automatically, and Row Level Security makes sure they only ever see their own tasks.

Live demo: https://taskboard-sooty-eight.vercel.app

## Features

- Four columns (To Do, In Progress, In Review, Done) with drag-and-drop between them, including touch and keyboard support
- Create, edit and delete tasks with title, description, priority, due date and labels
- Anonymous guest sign-in on first visit, with Row Level Security on every table
- Due-date badges for overdue and due-soon tasks
- Search plus priority and label filters
- Board summary: total, done, overdue and percent complete
- Task detail panel with comments and an activity log (recorded by a database trigger)
- Optimistic updates with rollback, loading skeletons, empty states and error messages

## Run locally

1. Create a free Supabase project.
2. In Supabase, go to Authentication > Sign In / Providers and turn on **Allow anonymous sign-ins**.
3. Open SQL Editor, paste the contents of `supabase/schema.sql`, and run it.
4. Copy `.env.example` to `.env` and fill in your project URL and anon key from Project Settings > API.
5. Install and start:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Deploy

Import the repo into Vercel, keep the Vite defaults, and add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` as environment variables. Only the public anon key is used in the
browser; the service role key is never needed.

## Project structure

```
supabase/schema.sql        tables, RLS policies, activity trigger
src/lib/useBoard.js        guest session, loading and saving tasks
src/lib/dates.js           due-date logic
src/components/Board.jsx   drag-and-drop context and columns
src/components/TaskPanel.jsx  edit form, comments, activity timeline
```
