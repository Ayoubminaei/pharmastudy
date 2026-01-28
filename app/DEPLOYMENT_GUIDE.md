# PharmaStudy - Deployment Guide

This guide will walk you through deploying your PharmaStudy application using GitHub, Supabase, and Vercel.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setting Up Supabase](#setting-up-supabase)
3. [Setting Up GitHub](#setting-up-github)
4. [Deploying to Vercel](#deploying-to-vercel)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, you'll need:
- A GitHub account (free at github.com)
- A Supabase account (free at supabase.com)
- A Vercel account (free at vercel.com)

---

## Setting Up Supabase

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose an organization (or create one)
4. Enter project details:
   - **Name**: `pharmastudy`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose the closest to your location
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

### Step 2: Get Your API Keys

1. Once your project is ready, click on the project
2. Go to **Project Settings** (gear icon in left sidebar)
3. Click on **API** in the left menu
4. Copy these values (you'll need them later):
   - **URL** (under Config > URL) - This is your `VITE_SUPABASE_URL`
   - **anon public** (under Project API keys) - This is your `VITE_SUPABASE_ANON_KEY`

### Step 3: Create Database Tables

1. Go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste this SQL to create all the necessary tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_items table
CREATE TABLE study_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  topic_id UUID REFERENCES topics ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('molecule', 'enzyme', 'medication')),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  structure_description TEXT,
  mechanism_description TEXT,
  uses TEXT,
  effects TEXT,
  pubchem_cid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Chapters policies
CREATE POLICY "Users can view own chapters" ON chapters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chapters" ON chapters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chapters" ON chapters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chapters" ON chapters
  FOR DELETE USING (auth.uid() = user_id);

-- Topics policies
CREATE POLICY "Users can view own topics" ON topics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own topics" ON topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics" ON topics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics" ON topics
  FOR DELETE USING (auth.uid() = user_id);

-- Study items policies
CREATE POLICY "Users can view own items" ON study_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own items" ON study_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON study_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON study_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click **Run** to execute the SQL

### Step 4: Configure Authentication

1. Go to **Authentication** in the left sidebar
2. Click on **Providers** in the left menu
3. Enable the providers you want (Email is enabled by default)
4. For Email provider, you can configure:
   - **Confirm email**: Toggle on/off (recommended: ON for production)
   - **Secure email change**: ON
   - **Secure password change**: ON

---

## Setting Up GitHub

### Step 1: Create a New Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon in the top right, then **New repository**
3. Enter repository details:
   - **Repository name**: `pharmastudy`
   - **Description**: `A pharmaceutical study app for organizing chapters, topics, molecules, enzymes, and medications`
   - **Visibility**: Public (or Private if you prefer)
4. Click **Create repository**

### Step 2: Upload Your Code

Since you have the code locally, you have two options:

#### Option A: Use GitHub Desktop (Easiest for beginners)

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Sign in with your GitHub account
3. Click **File** > **Add local repository**
4. Browse to your `/mnt/okcomputer/output/app` folder
5. Click **Add repository**
6. Click **Publish repository**
7. Choose your GitHub account and the repository name
8. Click **Publish repository**

#### Option B: Use Command Line

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to your project folder:
   ```bash
   cd /mnt/okcomputer/output/app
   ```
3. Initialize git and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/pharmastudy.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Deploying to Vercel

### Step 1: Connect Your GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New...** > **Project**
3. Under **Import Git Repository**, find and click **Import** next to your `pharmastudy` repository
4. If you don't see it, click **Adjust GitHub App Permissions** and grant access

### Step 2: Configure Project Settings

1. **Project Name**: `pharmastudy` (or any name you prefer)
2. **Framework Preset**: Select **Vite**
3. **Root Directory**: `./` (leave as default)
4. **Build Command**: `npm run build` (should be auto-detected)
5. **Output Directory**: `dist` (should be auto-detected)

### Step 3: Add Environment Variables

1. Expand the **Environment Variables** section
2. Add these two variables:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase URL (from Step 2 of Supabase setup) |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key (from Step 2 of Supabase setup) |

3. Click **Add** for each variable

### Step 4: Deploy

1. Click **Deploy**
2. Wait for the build to complete (usually 2-3 minutes)
3. Once done, you'll get a URL like `https://pharmastudy.vercel.app`
4. Click on the URL to view your live app!

---

## Environment Variables

Here's a summary of all environment variables you need:

| Variable Name | Description | Where to Find |
|---------------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase > Project Settings > API > URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase > Project Settings > API > Project API Keys > anon public |

### For Local Development

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit your `.env` file to GitHub! It should already be in `.gitignore`.

---

## Troubleshooting

### Build Fails on Vercel

**Problem**: Build fails with "Cannot find module" errors

**Solution**: 
1. Make sure all dependencies are in `package.json`
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` locally to verify
4. Push changes to GitHub
5. Redeploy on Vercel

### Supabase Connection Issues

**Problem**: App shows "Failed to fetch" or connection errors

**Solution**:
1. Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. Check that Row Level Security (RLS) policies are enabled
3. Make sure your Supabase project is active (not paused)

### Authentication Not Working

**Problem**: Can't sign up or log in

**Solution**:
1. Check that the `profiles` table exists in Supabase
2. Verify the trigger `on_auth_user_created` is set up correctly
3. Check Authentication > Providers in Supabase to ensure Email provider is enabled
4. Look at the browser console for specific error messages

### Images Not Loading

**Problem**: Chemical structure images not displaying

**Solution**:
1. Check your internet connection
2. PubChem API might be temporarily unavailable
3. Try refreshing the page

---

## Updating Your App

After making changes to your code:

1. **Save your changes** in your code editor
2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. **Vercel will automatically redeploy** your app!

---

## Custom Domain (Optional)

If you want to use your own domain:

1. In Vercel, go to your project
2. Click **Settings** > **Domains**
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

---

## Support

If you encounter issues:

1. **Check the browser console** (F12) for error messages
2. **Check Vercel logs**: Go to your project > Deployments > Click on the deployment > Build Logs
3. **Check Supabase logs**: Go to your project > Logs > API/Auth
4. **Create an issue** on GitHub if you need help

---

## Congratulations! 🎉

Your PharmaStudy app is now live and accessible worldwide! You can:

- Access it from any device with a web browser
- Share the URL with classmates
- Use it to organize your pharmaceutical studies
- Export your study materials to PDF
- Use flashcards to memorize molecules, enzymes, and medications

Happy studying! 📚💊
