# Kairos Fit

Build a mobile-first PWA fitness gamification app called KAIROS inspired by modern dark UI design with subtle anime aesthetics.

IMPORTANT:

This app is mobile-only (no desktop layout needed)

Design strictly for smartphone screens

Fully responsive for mobile sizes

Smooth, lightweight animations

Feels like a premium native app

🎨 DESIGN SYSTEM

Style:

Dark, premium, minimal, slightly aggressive

Inspired by anime like Baki but NOT overly anime

Anime is used only in background illustrations and avatars

UI remains clean, modern, and readable

Colors:

Background: #0F1115

Card background: #1A1D23

Primary accent (buttons, XP): #C23B3B

Secondary accent: #3A6EA5 (optional)

Text primary: #E6E6E6

Text secondary: #9AA0A6

UI rules:

Soft rounded corners (not too round)

Subtle shadows, no heavy gradients

Clean spacing and hierarchy

Smooth transitions and micro-interactions

Red glow effects for important actions (XP, buttons)

Typography:

Clean, modern sans-serif

Strong hierarchy (large numbers for XP, level)

📱 CORE SCREENS (PHASE 1)

1. HOME (Dashboard)

Top Section:

Circular avatar (anime-style portrait)

Username greeting (e.g. "Yo, Abdul.")

Subtitle: motivational line

Level Card:

Level number (large)

XP progress bar

Title (e.g. "Warrior")

Streak:

Fire icon + day streak count

Small motivational text

Primary CTA:

Large red button: "Log Workout"

Progress Section:

"Today's Progress" bar

Small stat cards:

Total workouts

Weekly XP

Calories

Achievements Preview:

Horizontal scroll

3–4 badges

Locked + unlocked states

Leaderboard Preview:

Top 3 friends

Rank, level, XP

Bottom Navigation:

Home

Workout

Progress

Leaderboard

Profile

2. WORKOUT (Log Workout)

Top:

Hero banner (anime-style gym character illustration)

Search:

Search bar: "Search exercise..."

Filter icon

Filters:

ALL, Chest, Back, Legs, Shoulders, Arms

Exercise List:

Exercise name

Muscle group

Equipment

Small muscle illustration

Add button (+)

CTA:

"Create Workout" button

3. PROGRESS

XP Overview:

Weekly XP bar chart

Stats:

Percentage change from last week

Muscle Groups:

Front/back body diagram

Highlight trained muscles

Lifetime Stats:

Workouts

Hours trained

Calories

PRs

4. PROFILE

Top:

Avatar

Username

Title (e.g. "The Relentless")

Level:

XP progress bar

Rank Section:

Rank badge (e.g. Warrior)

"View Ranks" button

Badges:

Grid or horizontal scroll

Menu:

Stats

Achievements

Workout history

Friends

Settings

⚙️ FUNCTIONALITY (PHASE 1)

Authentication:

Email + password (Supabase)

Workout Logging:

Create workout

Add exercises

Store sets, reps, weight

XP System:

+100 XP per workout

+10 XP per set

Store total XP

Calculate level from XP

Level Formula:
Level = sqrt(total_xp / 100)

Streak System:

Daily workout tracking

Increment streak if user trains

Achievements (basic):

First workout

3-day streak

5 workouts

🗄️ DATABASE (Supabase)

Tables:

users:

id

username

level

xp

streak

avatar

title

workouts:

id

user_id

date

exercises:

id

name

muscle_group

equipment

workout_exercises:

id

workout_id

exercise_id

sets

reps

weight

achievements:

id

name

description

icon

user_achievements:

id

user_id

achievement_id

unlocked_at

✨ ANIMATIONS

XP gain animation after workout

Button press feedback

Smooth screen transitions

Progress bar animations

📦 PWA REQUIREMENTS

Installable on mobile

App-like experience

Fast loading

Offline-ready basic support

Touch-optimized UI

🎯 GOAL

Deliver a clean, premium-feeling fitness app that:

Feels like a game

Encourages consistency

Looks modern and unique

Matches the provided dark anime-inspired UI style

Focus on:

Smooth UX

Fast workout logging

Clear progression feedback

Do NOT overcomplicate features.
Keep it clean and polished.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kairosgym.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9cc3554a-a8ac-4cca-9e07-15cffb4090d5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
