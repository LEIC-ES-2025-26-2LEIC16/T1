describe('User Story 1 - Report problems with recycling bins', () => {

  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // ─── Scenario 1: Normal case (Report a problem) ───────────────────────────

  describe('Scenario 1 - Normal case: Report a problem', () => {

    it('Step 1 - should show recycling bin details when a bin is selected', async () => {
      await element(by.id('map-screen')).waitToBeVisible();
      await element(by.id('recycling-bin-marker')).tap();
      await expect(element(by.id('bin-details-panel'))).toBeVisible();
    });

    it('Step 2 - should record the selected problem type', async () => {
      await element(by.id('map-screen')).waitToBeVisible();
      await element(by.id('recycling-bin-marker')).tap();
      await element(by.id('report-problem-button')).tap();
      await element(by.id('problem-type-bin-full')).tap();
      await expect(element(by.id('problem-type-bin-full'))).toHaveValue('selected');
    });

    it('Step 3 - should store the report when submitted', async () => {
      await element(by.id('map-screen')).waitToBeVisible();
      await element(by.id('recycling-bin-marker')).tap();
      await element(by.id('report-problem-button')).tap();
      await element(by.id('problem-type-bin-full')).tap();
      await element(by.id('description-input')).typeText('The bin has been overflowing for two days.');
      await element(by.id('submit-report-button')).tap();
      await expect(element(by.id('confirmation-message'))).toBeVisible();
    });

    it('Step 4 - should show a confirmation message after submission', async () => {
      await element(by.id('map-screen')).waitToBeVisible();
      await element(by.id('recycling-bin-marker')).tap();
      await element(by.id('report-problem-button')).tap();
      await element(by.id('problem-type-damaged')).tap();
      await element(by.id('submit-report-button')).tap();
      await expect(element(by.id('confirmation-message'))).toBeVisible();
      await expect(element(by.text('Report submitted successfully'))).toBeVisible();
    });

  });

  // ─── Scenario 2: Exceptional case (Invalid report) ────────────────────────

  describe('Scenario 2 - Exceptional case: Invalid report (no problem type selected)', () => {

    it('Step 1 - should block submission when no problem type is selected', async () => {
      await element(by.id('map-screen')).waitToBeVisible();
      await element(by.id('recycling-bin-marker')).tap();
      await element(by.id('report-problem-button')).tap();
      await element(by.id('submit-report-button')).tap();
      await expect(element(by.id('confirmation-message'))).not.toBeVisible();
    });

    it('Step 2 - should show an error message when no problem type is selected', async () => {
      await element(by.id('map-screen')).waitToBeVisible();
      await element(by.id('recycling-bin-marker')).tap();
      await element(by.id('report-problem-button')).tap();
      await element(by.id('submit-report-button')).tap();
      await expect(element(by.id('error-message'))).toBeVisible();
      await expect(element(by.text('Please select a problem type'))).toBeVisible();
    });

  });

});
