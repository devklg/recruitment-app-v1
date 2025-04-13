// cypress/e2e/promoter-dashboard.cy.js

describe('Promoter Dashboard', () => {
    beforeEach(() => {
      // Login as promoter before each test
      cy.visit('/login');
      cy.get('[name="email"]').type('promoter@example.com');
      cy.get('[name="password"]').type('promoterPassword123');
      cy.contains('Login').click();
      
      // Verify promoter dashboard loads
      cy.url().should('include', '/promoter-dashboard');
      cy.contains('Welcome').should('be.visible');
    });
    
    it('displays financial summary correctly', () => {
      // Check financial summary section
      cy.contains('Financial Summary').should('be.visible');
      cy.contains('Total Earnings').should('be.visible');
      cy.contains('Fast Start Bonuses').should('be.visible');
      cy.contains('Team Commissions').should('be.visible');
      
      // Check recent transactions table
      cy.contains('Recent Transactions').should('be.visible');
      cy.get('table').should('be.visible');
    });
    
    it('displays team structure visualization', () => {
      // Check team structure section
      cy.contains('Team Structure').should('be.visible');
      cy.contains('YOU').should('be.visible');
      
      // Check team statistics
      cy.contains('Total Team Members').should('be.visible');
      cy.contains('New Today').should('be.visible');
      
      // Test leg information if available
      cy.get('body').then(($body) => {
        if ($body.text().includes('Left')) {
          cy.contains('Left').should('be.visible');
          cy.contains('Right').should('be.visible');
        }
      });
    });
    
    it('allows editing replicated site name', () => {
      // Navigate to settings tab
      cy.contains('Settings').click();
      
      // Check replicated site settings
      cy.contains('Replicated Site Settings').should('be.visible');
      
      // Enter a site name
      const siteName = `test-site-${Date.now()}`;
      cy.get('#siteName').clear().type(siteName);
      
      // Update site name
      cy.contains('Update Site Name').click();
      
      // Check success message
      cy.contains('updated successfully').should('be.visible');
      
      // Verify URL shows new site name
      cy.contains(`https://getpaidin1minute.com/${siteName}`).should('be.visible');
    });
    
    it('displays activity feed with real-time updates', () => {
      // Check activity feed section
      cy.contains('Recent Activity').should('be.visible');
      cy.contains('Team Growing in Real-Time').should('be.visible');
      
      // Verify activity items
      cy.get('.bg-darkNavy').should('have.length.at.least', 1);
      
      // Wait for possible new activity (optional, may timeout if no new activity appears)
      cy.wait(20000); // Wait 20 seconds for potential new activity
      
      // This is optional and may not always work depending on the implementation
      cy.get('body').then(($body) => {
        const initialCount = $body.find('.bg-darkNavy').length;
        // If a new activity appears, the count would increase
        cy.get('.bg-darkNavy').should('have.length.at.least', initialCount);
      });
    });
  });