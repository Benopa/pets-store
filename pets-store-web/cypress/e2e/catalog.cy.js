// Каталог в режиме персонала: админ видит товары, но не может покупать.
describe('Каталог — режим персонала (админ)', () => {
  beforeEach(() => cy.loginAs('admin@example.com', 'admin123'));

  it('каталог виден, но без корзины и кнопок покупки', () => {
    cy.contains('Животные').should('be.visible');
    // У персонала нет иконки корзины и кнопок «В корзину».
    cy.get('button[aria-label="Корзина"]').should('not.exist');
    cy.contains('button', 'В корзину').should('not.exist');
  });
});
