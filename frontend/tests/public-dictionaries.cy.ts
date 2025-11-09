describe('Public Dictionaries Page', () => {
    beforeEach(() => {
        cy.visit('/dictionaries/public');
    });

    it('should display the page title', () => {
        cy.contains('h1', 'Публичные словари').should('be.visible');
        cy.contains(
            'p',
            'Изучайте словари, созданные другими пользователями'
        ).should('be.visible');
    });

    it('should display filters', () => {
        cy.contains('h3', 'Фильтры').should('be.visible');
        cy.get('input[placeholder="Введите название словаря..."]').should(
            'be.visible'
        );
        cy.contains('label', 'Исходный язык').should('be.visible');
        cy.contains('label', 'Целевой язык').should('be.visible');
        cy.contains('label', 'Сортировка по').should('be.visible');
        cy.contains('label', 'Порядок').should('be.visible');
    });

    it('should display dictionaries', () => {
        cy.get('[data-testid="dictionary-card"]').should(
            'have.length.greaterThan',
            0
        );
    });

    it('should filter by search', () => {
        cy.get('input[placeholder="Введите название словаря..."]').type(
            'английские'
        );
        cy.wait(500); // Wait for debounce
        cy.get('[data-testid="dictionary-card"]').should(
            'have.length.greaterThan',
            0
        );
    });

    it('should filter by source language', () => {
        cy.contains('label', 'Исходный язык')
            .parent()
            .find('select')
            .select('English');
        cy.get('[data-testid="dictionary-card"]').should(
            'have.length.greaterThan',
            0
        );
    });

    it('should filter by target language', () => {
        cy.contains('label', 'Целевой язык')
            .parent()
            .find('select')
            .select('Russian');
        cy.get('[data-testid="dictionary-card"]').should(
            'have.length.greaterThan',
            0
        );
    });

    it('should sort by likes', () => {
        cy.contains('label', 'Сортировка по')
            .parent()
            .find('select')
            .select('Лайкам');
        cy.get('[data-testid="dictionary-card"]').should(
            'have.length.greaterThan',
            0
        );
    });

    it('should display dictionary information', () => {
        cy.get('[data-testid="dictionary-card"]')
            .first()
            .within(() => {
                cy.get('h3').should('be.visible'); // Dictionary name
                cy.get('button').contains('♥').should('be.visible'); // Like button
                cy.contains('слов').should('be.visible'); // Word count
                cy.contains('→').should('be.visible'); // Language direction
                cy.contains('Начать изучение').should('be.visible'); // Study button
            });
    });

    it('should navigate to study page', () => {
        cy.get('[data-testid="dictionary-card"]')
            .first()
            .find('a')
            .contains('Начать изучение')
            .click();
        cy.url().should('include', '/learn/');
    });
});
