import { useEffect, useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { RESTING_EVENT } from './api.js'
import { ClinicProvider } from './clinic.jsx'
import { useClinic } from './clinicContext.js'
import Home from './pages/Home.jsx'
import Book from './pages/Book.jsx'
import Booked from './pages/Booked.jsx'
import Manage from './pages/Manage.jsx'
import Staff from './pages/Staff.jsx'
import Minutes from './pages/Minutes.jsx'

// HashRouter: the app is served from a sub-path on GitHub Pages, where a reload of /book/1 would otherwise 404.
export default function App() {
  const [resting, setResting] = useState(false)

  useEffect(() => {
    const rest = () => setResting(true)
    window.addEventListener(RESTING_EVENT, rest)
    return () => window.removeEventListener(RESTING_EVENT, rest)
  }, [])

  if (resting) return <div className="resting"><p>This app is resting and will be back soon.</p></div>

  return (
    <HashRouter>
      <ClinicProvider>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book/:serviceId" element={<Book />} />
            <Route path="/booked" element={<Booked />} />
            <Route path="/manage/:token" element={<Manage />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/minutes" element={<Minutes />} />
            <Route path="*" element={<div className="page"><h1>Page not found</h1><Link to="/">Go to the clinic</Link></div>} />
          </Routes>
        </main>
      </ClinicProvider>
    </HashRouter>
  )
}

function Header() {
  const clinic = useClinic()
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">+</span>
        {clinic.name}
      </Link>
      <nav className="header-links">
        <Link to="/minutes" className="staff-link">Minutes</Link>
        <Link to="/staff" className="staff-link">Staff</Link>
      </nav>
    </header>
  )
}
