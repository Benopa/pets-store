import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '../features';
import { HomePage, LoginPage, RegisterPage, AccountPage, CartPage, ModerationPage } from '../pages';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchAnimals, fetchCategories, fetchMe } from '../features/animal';

const PrivateRoute = ({ children }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? <Navigate to="/" replace /> : children;
};

// Доступ только для модератора/админа. Пока роль не загружена (fetchMe) — ждём, не редиректим.
const StaffRoute = ({ children }) => {
  const { accessToken, role } = useSelector((state) => state.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  if (!role) return null;
  if (role !== 'moderator' && role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export const App = () => {
  const dispatch = useDispatch();
  const { categoryId, search } = useSelector((state) => state.animal);
  const accessToken = useSelector((state) => state.auth.accessToken);
  useEffect(() => {
    dispatch(fetchAnimals({ categoryId, name: search }));
  }, [dispatch, categoryId, search]);
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  // Профиль + избранное (с бэкенда) при входе/перезагрузке
  useEffect(() => {
    if (accessToken) dispatch(fetchMe());
  }, [dispatch, accessToken]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/account"
            element={
              <PrivateRoute>
                <AccountPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <PrivateRoute>
                <CartPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/moderation"
            element={
              <StaffRoute>
                <ModerationPage />
              </StaffRoute>
            }
          />
          <Route
            path="/login"
            element={
              // HOC
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};
