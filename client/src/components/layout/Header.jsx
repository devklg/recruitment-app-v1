import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Header = () => {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-darkNavy shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-gold">Magnificent</span>
              <span className="text-white"> Worldwide</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white hover:text-gold transition-colors">
              Home
            </Link>
            <Link to="/#opportunity" className="text-white hover:text-gold transition-colors">
              Opportunity
            </Link>
            <Link to="/#packages" className="text-white hover:text-gold transition-colors">
              Packages
            </Link>
            <Link to="/#contact" className="text-white hover:text-gold transition-colors">
              Contact
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center text-white hover:text-gold transition-colors">
                  <span className="mr-2">{user.firstName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-navy rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  {user.role === 'pre-enrollee' &amp;&amp; (
                    <Link to="/pre-enrollee-dashboard" className="block px-4 py-2 text-white hover:bg-darkNavy">
                      Dashboard
                    </Link>
                  )}

                  {user.role === 'promoter' &amp;&amp; (
                    <Link to="/promoter-dashboard" className="block px-4 py-2 text-white hover:bg-darkNavy">
                      Dashboard
                    </Link>
                  )}

                  {user.role === 'admin' &amp;&amp; (
                    <Link to="/admin-dashboard" className="block px-4 py-2 text-white hover:bg-darkNavy">
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-white hover:bg-darkNavy"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/pre-enroll"
                className="bg-gradient-to-r from-royalBlue to-gold text-white font-bold py-2 px-6 rounded-full hover:from-gold hover:to-royalBlue transition-all duration-300"
              >
                Register Now
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen &amp;&amp; (
          <nav className="mt-4 py-4 border-t border-gray-700 md:hidden">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-white hover:text-gold transition-colors">
                Home
              </Link>
              <Link to="/#opportunity" className="text-white hover:text-gold transition-colors">
                Opportunity
              </Link>
              <Link to="/#packages" className="text-white hover:text-gold transition-colors">
                Packages
              </Link>
              <Link to="/#contact" className="text-white hover:text-gold transition-colors">
                Contact
              </Link>

              {user ? (
                <>
                  {user.role === 'pre-enrollee' &amp;&amp; (
                    <Link to="/pre-enrollee-dashboard" className="text-white hover:text-gold transition-colors">
                      Dashboard
                    </Link>
                  )}

                  {user.role === 'promoter' &amp;&amp; (
                    <Link to="/promoter-dashboard" className="text-white hover:text-gold transition-colors">
                      Dashboard
                    </Link>
                  )}

                  {user.role === 'admin' &amp;&amp; (
                    <Link to="/admin-dashboard" className="text-white hover:text-gold transition-colors">
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-gold transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/pre-enroll"
                  className="bg-gradient-to-r from-royalBlue to-gold text-white font-bold py-2 px-6 rounded-full hover:from-gold hover:to-royalBlue transition-all duration-300 inline-block"
                >
                  Register Now
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header