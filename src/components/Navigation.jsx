import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white font-bold">Repliq</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {user.role === 'admin' ? (
                  <>
                    <Link
                      to="/requests"
                      className={`${isActive('/requests')} px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Demandes reçues
                    </Link>
                    <Link
                      to="/admin"
                      className={`${isActive('/admin')} px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Administration
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/new-request"
                      className={`${isActive('/new-request')} px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Nouvelle demande
                    </Link>
                    <Link
                      to="/library"
                      className={`${isActive('/library')} px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Bibliothèque
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-300 mr-4">
              {user.email} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 