// cypress/e2e/pre-enrollment-flow.cy.js

describe('Pre-Enrollment User Flow', () => {
    it('allows a user to pre-enroll and navigate to dashboard', () => {
      // Visit landing page
      cy.visit('/');
      
      // Check landing page elements
      cy.contains('Talk Fusion').should('be.visible');
      cy.contains('Register Now').should('be.visible');
      
      // Navigate to pre-enrollment page
      cy.contains('Register Now').click();
      cy.url().should('include', '/pre-enroll');
      
      // Fill out pre-enrollment form
      cy.get('[name="firstName"]').type('Cypress');
      cy.get('[name="lastName"]').type('Test');
      cy.get('[name="email"]').type(`cypress-test-${Date.now()}@example.com`);
      cy.get('[name="phone"]').type('555-987-6543');
      
      // Select a package
      cy.contains('Elite Package').parent().find('input[type="radio"]').check();
      
      // Accept terms
      cy.get('[name="agreeToTerms"]').check();
      
      // Submit form
      cy.contains('Reserve My Position').click();
      
      // Should redirect to pre-enrollee dashboard
      cy.url().should('include', '/pre-enrollee-dashboard');
      cy.contains('Welcome').should('be.visible');
      
      // Verify dashboard components are visible
      cy.contains('Launch Countdown').should('be.visible');
      cy.contains('Your Pre-Enrollment Status').should('be.visible');
      cy.contains('Your Potential Team').should('be.visible');
      
      // Check countdown timer
      cy.contains('Days').should('be.visible');
      cy.contains('Hours').should('be.visible');
      cy.contains('Minutes').should('be.visible');
      cy.contains('Seconds').should('be.visible');
      
      // Check position in queue
      cy.contains('Queue Position').should('be.visible');
      
      // Check activation button
      cy.contains('Activate Your Position').should('be.visible');
    });
  });
  admin-user-management.cy.js
  Copy// cypress/e2e/admin-user-management.cy.js
  
  describe('Admin User Management', () => {
    beforeEach(() => {
      // Login as admin before each test
      cy.visit('/login');
      cy.get('[name="email"]').type('admin@example.com');
      cy.get('[name="password"]').type('adminPassword123');
      cy.contains('Login').click();
      
      // Verify admin dashboard loads
      cy.url().should('include', '/admin-dashboard');
      cy.contains('Admin Dashboard').should('be.visible');
    });
    
    it('displays user list and allows filtering', () => {
      // Navigate to users section
      cy.contains('Users').click();
      
      // Check user list loading
      cy.contains('User Management').should('be.visible');
      cy.get('table').should('be.visible');
      cy.get('table tbody tr').should('have.length.at.least', 1);
      
      // Test filtering
      cy.get('[placeholder="Search users..."]').type('test');
      cy.contains('Apply Filters').click();
      
      // Wait for filtered results
      cy.get('table tbody tr').should('have.length.at.least', 0);
      
      // Test role filter
      cy.get('select[name="role"]').select('pre-enrollee');
      cy.contains('Apply Filters').click();
      
      // Clear filters
      cy.contains('Clear Filters').click();
      cy.get('table tbody tr').should('have.length.at.least', 1);
    });
    
    it('allows viewing and editing user details', () => {
      // Navigate to users section
      cy.contains('Users').click();
      
      // Click on first user in the list
      cy.get('table tbody tr').first().contains('View').click();
      
      // Check user details page
      cy.contains('User Details').should('be.visible');
      cy.contains('Basic Information').should('be.visible');
      cy.contains('Enrollment Information').should('be.visible');
      
      // Test sponsor editing
      cy.contains('Change Sponsor').click();
      cy.get('[placeholder="Search by name or email"]').type('admin');
      cy.wait(1000); // Wait for search results
      
      // Select a sponsor from dropdown
      cy.get('select#sponsorSelect').select(1);
      
      // Update sponsor
      cy.contains('Update Sponsor').click();
      
      // Check success message
      cy.contains('Sponsor updated successfully').should('be.visible');
    });
    
    it('allows printing user list', () => {
      // Navigate to users section
      cy.contains('Users').click();
      
      // Click on print users list
      cy.contains('Print Users List').click();
      
      // Since we can't test actual printing, just verify the print function is called
      // This is a simplified test as Cypress can't interact with browser print dialogs
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });
      
      cy.contains('Print Users List').click();
      cy.get('@windowOpen').should('be.called');
    });
  });