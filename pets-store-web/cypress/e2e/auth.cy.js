// Логин через UI-форму (admin сидируется бэкендом из ADMIN_EMAIL/ADMIN_PASSWORD).
describe('Авторизация', () => {
  it('админ входит через форму и попадает в каталог', () => {
    cy.visit('/login');
    cy.get('input[placeholder="you@example.com"]').type('admin@example.com');
    cy.get('input[placeholder="••••••••"]').type('admin123');
    cy.contains('button', 'Войти').click();
    cy.location('pathname').should('eq', '/');
    cy.contains('Животные').should('be.visible');
  });

  it('неверный пароль показывает ошибку', () => {
    cy.visit('/login');
    cy.get('input[placeholder="you@example.com"]').type('admin@example.com');
    cy.get('input[placeholder="••••••••"]').type('totally-wrong');
    cy.contains('button', 'Войти').click();
    cy.get('.ant-alert-error').should('exist');
    cy.location('pathname').should('eq', '/login');
  });
});
