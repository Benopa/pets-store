import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '../features';
import { HomePage, LoginPage } from '../pages';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchAnimals, fetchCategories } from '../features/animal';

const PrivateRoute = ({ children }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  return accessToken ? <Navigate to="/" replace /> : children;
};

export const App = () => {
  const dispatch = useDispatch();
  const { categoryId, search } = useSelector((state) => state.animal);
  useEffect(() => {
    dispatch(fetchAnimals({ categoryId, name: search }));
  }, [dispatch, categoryId, search]);
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

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
            path="/login"
            element={
              // HOC
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};
