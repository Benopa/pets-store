import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Input } from 'antd';
import { loginAuth } from '../../features';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(loginAuth({ email, password }));
  };

  return (
    <div className="max-w-xs mx-auto">
      <h1 className="text-2xl font-light text-stone-800 mb-8">Вход</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-stone-500 mb-1">Email</label>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-stone-500 mb-1">Пароль</label>
          <Input.Password
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full"
          />
          {/* <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full border border-stone-200 rounded px-3 py-2 text-stone-800 focus:outline-none focus:border-stone-400"
          /> */}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="primary" htmlType="submit" disabled={loading} className="w-full">
          {loading ? 'Вход...' : 'Войти'}
        </Button>
        {/* <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button> */}
      </form>
    </div>
  );
};
