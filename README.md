# CampusConnect

A student hub for Sacramento State: find campus events, join study groups and message classmates, all in one place.

**Live demo:** https://campus-connect-two-theta.vercel.app

![CampusConnect screenshot](docs/screenshot.png)

> CampusConnect is an independent student project inspired by Sac State. It is not an official Sacramento State service.

## Features

- **Events:** browse upcoming campus events and search them by title.
- **Study groups:** see course study groups and create your own.
- **Messages:** post to a shared message board with your name.
- **Notifications:** a feed of reminders and activity.

## Tech stack

- [React 19](https://react.dev)
- [Vite](https://vite.dev)
- ESLint
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

## Roadmap

- [ ] Save data so groups and messages survive a refresh
- [ ] Real sign-in, limited to `@csus.edu` emails
- [ ] Join study groups, with member counts and a chat per group
- [ ] Let students and clubs post events, with RSVP and "Add to calendar"
- [ ] Notifications based on real activity
- [ ] Installable on phones (PWA)

## Contributing

Ideas and bug reports are welcome. Open an [issue](https://github.com/Rakibul475/CampusConnect/issues) or a pull request.

## Author

Built by [Md Rakibul Islam Rifath](https://github.com/Rakibul475).
