'use strict';

// A provider can implement this interface without exposing credentials to the browser.
const demoPayment = {
  authorize(scenario) {
    if (!['success', 'failure', 'cancel'].includes(scenario)) {
      return { outcome: 'invalid' };
    }
    return { outcome: scenario };
  }
};

module.exports = { demoPayment };
