import { useState, useEffect } from 'react'
import LoginPage from './Pages/Loginpage'
import Dashboard from './Pages/Dashboard'
import VehicleRegistry from './Pages/VehicleRegistry'
import TripDispatcher from './Pages/TripDispatcher'
import MaintenanceLogs from './Pages/MaintenanceLogs'
import FuelExpenses from './Pages/FuelExpenses'
import DriverProfiles from './Pages/DriverProfiles'
import Analytics from './Pages/Analytics'
import './Styles/global.css'
import api from './api'

// ── Role-Based Access Control ─────────────────────────────
// Defines which pages each role can access
export const ROLE_PERMISSIONS = {
  Manager:    ["dashboard", "vehicles", "trips", "maintenance", "fuel", "drivers", "analytics"],
  Dispatcher: ["dashboard", "vehicles", "trips", "drivers"],
  Safety:     ["dashboard", "maintenance", "drivers"],
  Analyst:    ["dashboard", "fuel", "analytics"],
}

export const canAccess = (role, page) => {
  const publicPages = ["login"]
  if (publicPages.includes(page)) return true
  return ROLE_PERMISSIONS[role]?.includes(page) ?? false
}
// ─────────────────────────────────────────────────────────

function App() {
  const [user,  setUser]  = useState(null)
  
  // Disable automatic scroll restoration for cleaner manual transitions
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  const [page,  setPage]  = useState(() => {
    // Check URL hash for page state on initial load
    const hash = window.location.hash.replace('#', '')
    return hash || "login"
  })
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("transitops-theme") || "dark"
  })

  // Apply theme class to root element
  useEffect(() => {
    const root = document.documentElement
    if (theme === "light") {
      root.classList.add("light")
    } else {
      root.classList.remove("light")
    }
    localStorage.setItem("transitops-theme", theme)
  }, [theme])

  // Auto-scroll to top on page change
  useEffect(() => {
    // Both window and body/html as fallbacks
    window.scrollTo(0, 0);
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setPage(hash)
      } else {
        setPage('login')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])


  const handleLogin  = (userData) => { 
    setUser(userData); 
    setPage("dashboard"); 
    api.defaults.headers.common['x-user-email']  = userData.email;
    api.defaults.headers.common['x-user-role']   = userData.role;
    api.defaults.headers.common['x-company-id']  = userData.companyId || 'demo';
  }
  const handleLogout = () => { 
    setUser(null); 
    setPage("login"); 
    delete api.defaults.headers.common['x-user-email'];
    delete api.defaults.headers.common['x-user-role'];
    delete api.defaults.headers.common['x-company-id'];
  }
  const handleToggle = () => setTheme(t => t === "dark" ? "light" : "dark")

  // Guard: if user tries to navigate to a page they can't access, block it
  const handleNavigate = (targetPage) => {
    if (canAccess(user?.role, targetPage)) {
      setPage(targetPage)
    }
  }

  // Custom setPage that also updates URL
  const setPageWithHistory = (newPage) => {
    // Definitive scroll to top for all navigation
    window.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);

    if (newPage !== page) {
      // Use hash directly for cleaner browser history integration
      window.location.hash = newPage === 'login' ? '' : newPage;
      setPage(newPage)
    }
  }

  // If not logged in, show Login page
  if (!user) {
    return (
      <div id="app-root">
        <div id="top-anchor" style={{ position: 'absolute', top: 0, left: 0, height: 1, width: 1, opacity: 0 }} />
        <LoginPage onLogin={handleLogin} setPage={setPageWithHistory} />
      </div>
    )
  }

  // If current page is not accessible (e.g. after role switch), fallback to dashboard
  if (!canAccess(user.role, page)) {
    setPage("dashboard")
    return null
  }

  const props = {
    user,
    onNavigate:    handleNavigate,
    onLogout:      handleLogout,
    theme,
    onToggleTheme: handleToggle,
    permissions:   ROLE_PERMISSIONS[user.role] ?? [],
  }

  switch (page) {
    case "dashboard":   return <Dashboard      {...props} />
    case "vehicles":    return <VehicleRegistry {...props} />
    case "trips":       return <TripDispatcher  {...props} />
    case "maintenance": return <MaintenanceLogs {...props} />
    case "fuel":        return <FuelExpenses    {...props} />
    case "drivers":     return <DriverProfiles  {...props} />
    case "analytics":   return <Analytics       {...props} />
    default:            return <Dashboard       {...props} />
  }
}

export default App