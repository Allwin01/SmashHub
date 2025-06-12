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

/*  To install tailwind CSS :
npm install -D tailwindcss@3.4.1 postcss autoprefixer
npx tailwindcss init -p

npm install express@4.18.2 @types/express@4.17.17   

npm install mongoose@7.6.5 @types/mongoose@5.11.97  # Database
npm install bcrypt@5.1.1 @types/bcrypt@5.0.1        # Password hashing
npm install jsonwebtoken@9.0.2 @types/jsonwebtoken@9.0.3  # Auth tokens
npm install cors@2.8.5 @types/cors@2.8.13           # CORS middleware

// - for Typescript 
npx tsc --init

npm install -g nodemon
npm install --save-dev ts-node typescript


// - to close the window
npm install lucide-react
yarn add lucide-react


npm install cors //  for CORS ( Cross-Orgin Resource Sharing) in Express backend  as backend and frontend are in different ports 5000 /3000

npm install bcrypt  // to encryp password
npm install mongoose bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken  -  for password encryption  and session token 


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


Test Backend 
*** Signup API
curl -i -X OPTIONS http://localhost:5000/api/auth/signup \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

if 403 - Forbidden
sudo lsof -i :5000  // to check which service running on the port
**Login - API *****
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your@email.com", "password":"yourpassword"}'



Query Mongo DB

// Find users in your badmintonDB
db.users.find({email: "user@example.com"})

// Or if you need to authenticate
db.auth("username", "password")