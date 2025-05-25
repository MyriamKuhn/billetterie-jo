# 🎟️ JO Ticketing Frontend

This is the React/Vite frontend client for the Olympic Games Paris 2024 ticketing platform. It consumes our REST API via Axios and React Query, and offers a rich UI built with Material UI, typed forms, internationalization, lightweight state management, and more.

![Tests](https://img.shields.io/badge/tests-141_passed-4caf50.svg) ![Test Coverage](https://img.shields.io/badge/coverage-100%25-darkgreen)
![Vite](https://img.shields.io/badge/vite-6.3.5-blue) ![React](https://img.shields.io/badge/react-19.1.0-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)

---

## 📋 Table of Contents

- [🎟️ JO Ticketing Frontend](#️-jo-ticketing-frontend)
  - [📋 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [🔧 Requirements](#-requirements)
  - [📥 Installation](#-installation)
  - [🏗️ Environment Setup](#️-environment-setup)
  - [🏃‍♂️ Running the Application](#️-running-the-application)
    - [Build for production](#build-for-production)
    - [Deploy to production branch](#deploy-to-production-branch)
  - [🧪 Testing](#-testing)
  - [🚀 Future Evolutions](#-future-evolutions)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [📜 License](#-license)

---

## ✨ Features

- **React 19 + Vite** for ultra-fast development  
- **Material UI (MUI)** components: DataGrid, Dialog, Autocomplete, and more  
- **Typed forms** with React Hook Form + Zod  
- **Internationalization** via i18next/react-i18next (dynamic and static translations)  
- **Lightweight state management** with Zustand  
- **Data fetching & caching** with Axios + React Query  
- **Rich selects** with country flags (react-world-flags)  
- **Responsive design** and theme switching (light/dark)  
- **Unit tests** with Vitest + React Testing Library + jest-dom  
- **Coverage reports** automatically generated  

--- 

## 🔧 Requirements

- Node.js ≥ 18  
- npm or Yarn  
- Modern browser (Chrome, Firefox, Edge, Safari)  

---

## 📥 Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/<YourUsername>/billetterie-jo.git
   cd billetterie-jo
    ```
2. Install dependencies:
    ```bash
    npm install
    # or
    yarn
    ```
3. Configure the API base URL
    ```bash
    cp .env.example .env
    ```
4. In `.env`:
    ```bash
    VITE_API_BASE_URL=https://api-jo2024.mkcodecreations.dev/
    ```
    
---

## 🏗️ Environment Setup

In your `.env` file, configure:

Example for database settings:
```
# Base URL for the REST API
VITE_API_BASE_URL=https://api-jo2024.example.com

# Optional demo mode
VITE_USE_MOCK=false
```

---

## 🏃‍♂️ Running the Application

Start the local development server:

```bash
npm run dev
# or
yarn dev
```
Open your browser at
```
http://localhost:3000
```
### Build for production  
```bash
npm run build
# or
yarn build
```

### Deploy to production branch
I’ve added a one-liner script that does everything via a Git worktree:
```bash
npm run deploy:prod
# or
yarn deploy:prod
```
Under the hood, `deploy:prod` runs `scripts/deploy-prod-wt.sh`, which:
- Builds your app (npm run build)
- Creates/updates a prod/ worktree on production
- Cleans out prod/ (except .git & .gitignore)
- Copies the dist/ output into prod/
- Commits & force-pushes to origin/production
- Removes the temporary worktree

With this in place, a single command is all you need to publish!

---

## 🧪 Testing

The application has a **full feature test coverage**.

Full HTML report available under [Coverage HTML](https://myriamkuhn.github.io/billetterie-jo/).  

✅ **141 tests passed**.  
📊 **Coverage: 100%**

To run all automated tests:
```
npm run test
# or
yarn test
```
Generate coverage report:
```
npm run coverage
# or
yarn coverage
```

---

## 🚀 Future Evolutions

Planned improvements:
- PWA support & offline caching
- Order flow visualization dashboard
- Admin analytics with Recharts
- Additional languages (ES / PT…)

---

## 🛠️ Tech Stack

- **Core:**  
  - Vite (dev server & build)  
  - React 19  
  - TypeScript  

- **Styling & UI:**  
  - Material UI v7 (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)  
  - MUI X DataGrid (`@mui/x-data-grid`) & Autocomplete  

- **Routing & Head:**  
  - React Router v7 (`react-router-dom`)  
  - React Helmet (`react-helmet`)  

- **State & Forms:**  
  - Zustand (state management)  
  - React Hook Form (`react-hook-form`) + `@hookform/resolvers` + Zod  

- **Data & I18n:**  
  - Axios + TanStack React Query (`@tanstack/react-query`)  
  - i18next + `i18next-http-backend` + `i18next-browser-languagedetector` + React-i18next  

- **Cookies & Consent:**  
  - React Cookie Consent (`react-cookie-consent`)  

- **Testing:**  
  - Vitest  
  - React Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`)  
  - jest-dom (`@testing-library/jest-dom`)  

- **Linting & Formatting:**  
  - ESLint + Prettier + `@typescript-eslint`  

- **Dev Utilities:**  
  - identity-obj-proxy (for CSS modules in tests)  
  - jsdom (test environment)  

---

## 📜 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT)

*Developed with ❤️ by Myriam Kühn.*