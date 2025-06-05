# SmashHub 🏸

**SmashHub** is a modern Badminton Club Management platform built with Next.js + MongoDB.  
It helps coaches, parents, admins, and players manage training, tournaments, court assignments, and more.

## 🚀 Features

- Role-based dashboards (Admin, Player, Coach, Parent, Super Admin)
- Player skill tracking and assessment
- Club night drag-and-drop court management
- Tournament workflows
- Authentication with JWT & MongoDB
- Restring from locals



---

## 📛 Badges

![Repo Size](https://img.shields.io/github/repo-size/Allwin01/SmashHub)
![Last Commit](https://img.shields.io/github/last-commit/Allwin01/SmashHub)
![License](https://img.shields.io/github/license/Allwin01/SmashHub)
![Issues](https://img.shields.io/github/issues/Allwin01/SmashHub)
![Stars](https://img.shields.io/github/stars/Allwin01/SmashHub?style=social)
![Forks](https://img.shields.io/github/forks/Allwin01/SmashHub?style=social)
![Tech](https://img.shields.io/badge/built%20with-Next.js%20%2B%20MongoDB%20%2B%20Tailwind-blue)

---

## 🚀 Features

- ✅ Role-based dashboards (Admin, Coach, Parent, Player, Super Admin)
- 🏸 Player skill tracking and historical progress
- 🗂️ Tournament and match management
- 🗓️ Club night court assignment via drag-and-drop
- 🔐 Secure authentication (JWT + bcrypt)
- 📥 PDF download of skill assessments

---

## 🛠️ Tech Stack

- Next.js
- MongoDB
- Tailwind CSS
- JWT Authentication
- Node.js / Express (API layer)

## 📦 Project Setup Instructions


## 📦 Installation

### ✅ 1. Prerequisites

Install the following:

| Tool      | macOS (Terminal)                    | Windows (Link)                              |
|-----------|-------------------------------------|----------------------------------------------|
| Node.js   | `brew install node`                 | [nodejs.org](https://nodejs.org)             |
| Git       | Preinstalled or `brew install git` | [git-scm.com](https://git-scm.com/downloads) |
| MongoDB   | See below                           | [mongodb.com](https://www.mongodb.com/try)   |





### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Allwin01/SmashHub.git
cd SmashHub


/*  To install MongoDB locally (macOS):

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0  */

npm install    ( install depedencied) 
npm run dev    (Run the Development Server)

---

 ###   Create .env.local in the root:


MONGODB_URI=mongodb://localhost:27017/smashhub
JWT_SECRET=your_super_secret_key





🧰 Useful Commands
Command	Description
npm run dev	   - Run in development mode
npm run build	-Create production build
npm start	    - Run production server
npm install	    - Install all dependencies


