// Полный путь покупателя: регистрация → каталог → корзина → оформление заказа.
describe('Покупатель: корзина и оформление', () => {
  it('регистрируется, добавляет товар и оформляет заказ', () => {
    cy.registerBuyer();

    cy.contains('Животные', { timeout: 10000 }).should('be.visible');

    // Добавляем первый доступный товар в корзину.
    cy.contains('button', 'В корзину').first().click();

    // Переходим в корзину.
    cy.get('button[aria-label="Корзина"]').click();
    cy.location('pathname').should('eq', '/cart');

    // Оформляем: оплата при получении (без имитации банка), указываем адрес.
    cy.contains('button', 'Оформить заказ').click();
    cy.contains('При получении').click();
    cy.get('input[placeholder="Город, улица, дом, квартира"]').type('Москва, ул. Пушкина, 1');
    cy.contains('button', /Подтвердить заказ/).click();

    // Успех — появляется модалка «Заказ оформлен!» с кнопкой «К покупкам».
    cy.contains('Заказ оформлен', { timeout: 15000 }).should('exist');
    cy.contains('button', 'К покупкам').should('exist');
  });
});
