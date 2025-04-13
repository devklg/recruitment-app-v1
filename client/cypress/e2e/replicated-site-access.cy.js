// cypress/e2e/replicated-site-access.cy.js

describe('Replicated Site Access', () => {
    it('can access a promoter\'s replicated site', () => {
      // Visit a known replicated site
      // Note: For this test to work, you need to have a promoter with a known replicated site name
      // Replace 'test-site' with an actual replicated site name in your database
      cy.visit('/test-site');
      
      // Verify landing page content is displayed
      cy.contains('Talk Fusion').should('be.visible');
      cy.contains('Register Now').should('be.visible');
      
      // Check that the referral code is pre-populated
      cy.contains('Pre-enroll').click();
      cy.url().should('include', '/pre-enroll');
      
      // Check that the referrer field is pre-filled with the site owner's name
      cy.get('#referrer').should('not.have.value', '');
      cy.get('#referrer').should('be.disabled');
      
      // Complete pre-enrollment process with the referral
      cy.get('[name="firstName"]').type('Replicated');
      cy.get('[name="lastName"]').type('SiteTest');
      cy.get('[name="email"]').type(`replicated-test-${Date.now()}@example.com`);
      cy.get('[name="phone"]').type('555-321-7890');
      cy.get('[name="agreeToTerms"]').check();
      
      // Submit form
      cy.contains('Reserve My Position').click();
      
      // Should redirect to pre-enrollee dashboard
      cy.url().should('include', '/pre-enrollee-dashboard');
      
      // Verify correct sponsor is shown in pre-enrollee dashboard
      // This assumes the pre-enrollee dashboard shows sponsor information
      cy.get('body').then(($body) => {
        if ($body.text().includes('Sponsor')) {
          // The text should contain the replicated site owner's name
          cy.contains('Sponsor').parent().should('not.contain', 'None');
        }
      });
    });
    
    it('handles invalid replicated site names gracefully', () => {
      // Visit a non-existent replicated site
      cy.visit('/non-existent-site');
      
      // Should redirect to main landing page
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Verify standard landing page is shown without a referrer
      cy.contains('Talk Fusion').should('be.visible');
      cy.contains('Register Now').should('be.visible');
      
      // Verify pre-enrollment form doesn't have referrer pre-filled
      cy.contains('Register Now').click();
      cy.url().should('include', '/pre-enroll');
      
      // Check that the referrer field is set to default value
      cy.get('#referrer').should('have.value', 'Magnificent Worldwide Marketing & Sales Group');
      cy.get('#referrer').should('be.disabled');
    });
  });
  