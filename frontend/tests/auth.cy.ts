describe('Auth flows', () => {
    const fillAndSubmit = (pairs: Array<[string, string]>) => {
        pairs.forEach(([name, value]) => {
            cy.get(`input[name="${name}"]`).clear().type(value);
        });
        cy.get('button[type="submit"]').click();
    };

    it('registers a new user and redirects to login', () => {
        cy.intercept('POST', '**/auth/register', {
            statusCode: 201,
            body: { user: { id: 1, email: 'new@user.dev' } },
        }).as('register');

        cy.visit('/auth/register');
        fillAndSubmit([
            ['email', 'new@user.dev'],
            ['password', 'pass1234'],
            ['confirmPassword', 'pass1234'],
        ]);

        cy.wait('@register');
        cy.location('pathname').should('include', '/auth/login');
    });

    it('shows registration error when passwords do not match', () => {
        cy.intercept('POST', '**/auth/register', {
            statusCode: 400,
            body: { error: 'Passwords do not match' },
        }).as('registerFail');

        cy.visit('/auth/register');
        fillAndSubmit([
            ['email', 'err@user.dev'],
            ['password', 'pass1234'],
            ['confirmPassword', 'mismatch'],
        ]);

        cy.wait('@registerFail');
        cy.contains('Passwords do not match').should('exist');
    });

    it('logs in and stores token then redirects to My Dictionaries', () => {
        cy.intercept('POST', '**/auth/login', {
            statusCode: 200,
            body: { token: 'test.jwt.token' },
        }).as('login');

        cy.visit('/auth/login');
        fillAndSubmit([
            ['email', 'new@user.dev'],
            ['password', 'pass1234'],
        ]);

        cy.wait('@login');
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.eq('test.jwt.token');
        });
        cy.location('pathname').should('include', '/dictionaries/my');
    });

    it('guards profile page when not authenticated', () => {
        cy.visit('/profile');
        cy.location('pathname').should('include', '/auth/login');
    });
});
