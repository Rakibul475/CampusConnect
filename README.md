# CampusConnect

[![CI](https://github.com/Rakibul475/CampusConnect/actions/workflows/ci.yml/badge.svg)](https://github.com/Rakibul475/CampusConnect/actions/workflows/ci.yml)

A student hub for Sacramento State: find campus events, join study groups and message classmates, all in one place.

**Live demo:** https://campus-connect-two-theta.vercel.app

![CampusConnect screenshot](docs/screenshot.png)

> CampusConnect is an independent student project inspired by Sac State. It is not an official Sacramento State service.

## Features

- **Events:** browse upcoming events sorted by date, search by name, place or description, post your own, RSVP, and add them to Google Calendar or any calendar app (.ics).
- **Study groups:** find groups by course, create your own with a meeting time and place, and join or leave with one click.
- **Group chat:** every study group has its own chat; the Messages tab collects the chats for the groups you've joined.
- **Notifications:** activity from your RSVPs and groups, plus reminders for events you're going to in the next two days.
- **Shareable links:** each tab and group has its own URL, like `#/groups/csc-131`.

Everything you add is saved in your browser, so it's still there when you come back. Shared accounts and data across devices are on the roadmap.

![Study group chat](docs/group-chat.png)

## Tech stack

- [React 19](https://react.dev)
- [Vite](https://vite.dev)
- ESLint and Vitest, run on every push by GitHub Actions
- Deployed on [Vercel](https://vercel.com)

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/Rakibul475/CampusConnect.git
cd CampusConnect
npm install
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests (Vitest) |

## Roadmap

- [x] Save data so groups and messages survive a refresh
- [x] Join study groups, with member counts and a chat per group
- [x] Let students and clubs post events, with RSVP and "Add to calendar"
- [x] Notifications based on real activity
- [ ] Shared backend (Supabase) so everyone sees the same events, groups and chats
- [ ] Real sign-in, limited to `@csus.edu` emails
- [ ] Installable on phones (PWA)

## Contributing

Ideas and bug reports are welcome. Open an [issue](https://github.com/Rakibul475/CampusConnect/issues) or a pull request.

## Author

Built by [Md Rakibul Islam Rifath](https://github.com/Rakibul475).
