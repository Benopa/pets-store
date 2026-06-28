// Кастомные команды для e2e. Авторизацию делаем через API (быстро и без хрупкого UI),
// токен кладём в localStorage до загрузки приложения — фронт подхватит его через fetchMe.

const api = () => Cypress.env('apiUrl');

// Логин под существующим пользователем и переход в каталог уже авторизованным.
Cypress.Commands.add('loginAs', (email, password) => {
  cy.request('POST', `${api()}/auth/login`, { email, password }).then(({ body }) => {
    cy.visit('/', {
      onBeforeLoad: (win) => win.localStorage.setItem('token', body.accessToken),
    });
  });
});

// Регистрация нового покупателя со случайным email и переход в каталог авторизованным.
Cypress.Commands.add('registerBuyer', () => {
  const email = `buyer_${Date.now()}@test.dev`;
  cy.request('POST', `${api()}/auth/register`, {
    email,
    password: 'secret123',
    firstName: 'Тест',
    lastName: 'Покупатель',
    birthDate: '1990-01-01',
    role: 'buyer',
  }).then(({ body }) => {
    cy.visit('/', {
      onBeforeLoad: (win) => win.localStorage.setItem('token', body.accessToken),
    });
  });
});
