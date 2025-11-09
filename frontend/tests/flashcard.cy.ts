describe('Flashcard interactions', () => {
    it('shows translation and records result', () => {
        cy.intercept('GET', '**/words?dictionaryId=*', {
            statusCode: 200,
            body: [{ id: 1, word: 'hello', translation: 'привет' }],
        }).as('words');

        cy.intercept('POST', '**/sessions', {
            statusCode: 201,
            body: { id: 1 },
        }).as('session');

        // Bypass auth in client by setting token
        cy.visit('/learn/1', {
            onBeforeLoad(win) {
                win.localStorage.setItem('token', 'dummy');
            },
        });

        cy.wait('@words');
        cy.contains('Show Translation').click();
        cy.contains('Recalled').click();
        cy.wait('@session');
    });
});
