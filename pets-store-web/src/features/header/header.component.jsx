import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../animal/model/auth';

export const Header = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-medium text-stone-800 hover:text-stone-600">
          Pets Store
        </Link>
        <div className="flex gap-4">
          {accessToken ? (
            <button onClick={handleLogout} className="text-sm text-stone-500 hover:text-stone-700">
              Выйти
            </button>
          ) : (
            <Link to="/login" className="text-sm text-stone-500 hover:text-stone-700">
              Вход
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
