# 🎮 PSN Trophy Viewer

A modern, beautiful React application for viewing your PlayStation Network trophies with detailed statistics and progress tracking.

![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat&logo=vite)
![Node](https://img.shields.io/badge/Node-Express-339933?style=flat&logo=node.js)

## ✨ Features

### 🏆 Trophy Dashboard
- **User Profile**: Display your PSN avatar, online ID, and trophy level
- **Trophy Statistics**: Complete breakdown of Platinum, Gold, Silver, and Bronze trophies
- **Recent Games**: View your most recently played games with trophy progress

### 🎯 Game Detail View
- **Complete Trophy Lists**: Browse all trophies for any game in your library
- **DLC Support**: Automatically groups trophies by base game and DLC packs
- **Trophy Statistics**: See earned vs. total trophies for each section
- **Smart Filtering**: 
  - View all trophies
  - Show only earned trophies
  - Show only unearned trophies
- **Rarity Sorting**: Trophies sorted from rarest to most common within each group

### 🎨 Premium Design
- Dark mode with glassmorphism effects
- Smooth animations and transitions
- Responsive layout
- Color-coded trophy types (Platinum, Gold, Silver, Bronze)

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS for styling

**Backend:**
- Node.js + Express
- psn-api for PlayStation Network integration
- CORS enabled proxy server

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A PlayStation Network account
- NPSSO authentication token

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JMgranaBUAB/psn-react.git
   cd psn-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   NPSSO=your_npsso_token_here
   ```

   **How to get your NPSSO token:**
   1. Login to [PlayStation.com](https://www.playstation.com/)
   2. Open browser DevTools (F12)
   3. Go to Application → Cookies → https://www.playstation.com
   4. Find the cookie named `NPSSO` and copy its value

   ⚠️ **Important**: Keep your NPSSO token private. Never commit it to version control.

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both:
   - Frontend (Vite): `http://localhost:5173`
   - Backend (Express): `http://localhost:3001`

## 📁 Project Structure

```
psn-react/
├── src/
│   ├── components/
│   │   ├── TrophyCard.jsx      # Individual game card
│   │   ├── TrophyList.jsx      # Dashboard game grid
│   │   └── UserProfile.jsx     # Profile header component
│   ├── pages/
│   │   └── GameTrophies.jsx    # Detailed trophy view
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── server.js                    # Express proxy server
├── .env                         # Environment variables (not in repo)
├── .env.example                 # Environment template
└── package.json
```

## 🎮 Usage

1. **Dashboard**: View your profile and recent games
2. **Click any game**: Navigate to the detailed trophy view
3. **Filter trophies**: Use the filter buttons (Todos/Obtenidos/No obtenidos)
4. **Track progress**: See completion statistics for each DLC section

## 🔧 Available Scripts

- `npm run dev` - Start both frontend and backend servers
- `npm run server` - Start only the backend server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌟 Key Features Explained

### Trophy Grouping
Games with DLC automatically separate trophies into:
- **Base Game**: Main game trophies
- **DLC Sections**: Each DLC pack with its own trophy set

### Smart Filtering
Filter trophies by completion status without losing track of DLC organization:
- Empty sections are automatically hidden when filtered

### Rarity-Based Sorting
Trophies are sorted by their earned rate (rarest first), helping you:
- Identify challenging trophies
- Prioritize trophy hunting
- Track rare achievements

## 🔐 Security Notes

- NPSSO tokens expire periodically and need to be refreshed
- Never share your NPSSO token or commit it to public repositories
- The token grants access to your PSN account data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [psn-api](https://github.com/achievements-app/psn-api) - PlayStation Network API wrapper
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## 📧 Contact

**JMgranaBUAB**
- GitHub: [@JMgranaBUAB](https://github.com/JMgranaBUAB)

---

⭐ If you found this project useful, please consider giving it a star!
