import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { ClinicProvider, useClinic } from './clinic.jsx'
import Home from './pages/Home.jsx'
import Book from './pages/Book.jsx'
import Booked from './pages/Booked.jsx'
import Manage from './pages/Manage.jsx'
import Staff from './pages/Staff.jsx'

// HashRouter: the app is served from a sub-path on GitHub Pages, where a reload of /book/1 would otherwise 404.
export default function App() {
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
      <Link to="/staff" className="staff-link">Staff</Link>
    </header>
  )
}
