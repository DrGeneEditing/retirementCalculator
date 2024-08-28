QUnit.module('Input Parsing', function() {
    QUnit.test('parseNumber handles commas and dollar signs', function(assert) {
        assert.equal(parseNumber('1,000'), 1000, 'Handles commas');
        assert.equal(parseNumber('$1,000'), 1000, 'Handles dollar signs and commas');
        assert.equal(parseNumber('1000.50'), 1000.50, 'Handles decimals');
        assert.throws(() => parseNumber('invalid'), /Invalid number input/, 'Throws error for invalid input');
    });
});

QUnit.module('Currency Formatting', function() {
    QUnit.test('formatCurrency formats correctly', function(assert) {
        assert.equal(formatCurrency(1000), '$1,000.00', 'Formats thousands');
        assert.equal(formatCurrency(1000000, true), '$1.0M', 'Uses millions shorthand');
        assert.equal(formatCurrency(1500, true), '$1.5K', 'Uses thousands shorthand');
    });
});

QUnit.module('Retirement Calculations', function() {
    QUnit.test('calculateRetirement returns expected results', function(assert) {
        const inputs = {
            currentAge: 30,
            retirementAge: 65,
            lifeExpectancy: 90,
            returnRate: 0.07,
            inflationRate: 0.02,
            initialInvestment: 10000,
            contributionAmount: 5000,
            contributionInterval: 'annually',
            withdrawalAmount: 50000,
            inflationAdjustedWithdrawal: false,
            investmentStrategy: 'balanced'
        };

        const results = calculateRetirement(inputs);

        // Check overall structure
        assert.ok(results.hasOwnProperty('yearlyResults'), 'Results contain yearlyResults');
        assert.ok(results.hasOwnProperty('retirementSavings'), 'Results contain retirementSavings');
        assert.ok(results.hasOwnProperty('endOfLifeSavings'), 'Results contain endOfLifeSavings');

        // Check yearlyResults
        assert.equal(results.yearlyResults.length, 61, 'Correct number of years calculated');
        assert.equal(results.yearlyResults[0].age, 30, 'First year age is correct');
        assert.equal(results.yearlyResults[0].balance, 10000, 'First year balance is initial investment');

        const expectedSecondYearBalance = (10000 + 5000) * 1.07;
        const tolerance = 0.01; // 1% tolerance
        assert.ok(
            Math.abs(results.yearlyResults[1].balance - expectedSecondYearBalance) <= tolerance * expectedSecondYearBalance,
            'Second year balance calculation is correct within 1% tolerance'
        );

        assert.equal(results.yearlyResults[35].age, 65, 'Retirement age is correct');
        assert.ok(results.yearlyResults[35].withdrawal > 0, 'Withdrawals start at retirement age');
        assert.equal(results.yearlyResults[35].annualContribution, 0, 'Contributions stop at retirement age');

        assert.equal(results.yearlyResults[60].age, 90, 'Final year age is correct');
        assert.ok(results.yearlyResults[60].balance > 0, 'Final balance is positive');

        // Check retirementSavings
        assert.ok(results.retirementSavings.hasOwnProperty('nominal'), 'retirementSavings has nominal value');
        assert.ok(results.retirementSavings.hasOwnProperty('adjusted'), 'retirementSavings has adjusted value');
        assert.ok(results.retirementSavings.nominal > 0, 'Nominal retirement savings is positive');
        assert.ok(results.retirementSavings.adjusted > 0, 'Adjusted retirement savings is positive');

        // Check endOfLifeSavings
        assert.ok(results.endOfLifeSavings.hasOwnProperty('nominal'), 'endOfLifeSavings has nominal value');
        assert.ok(results.endOfLifeSavings.hasOwnProperty('adjusted'), 'endOfLifeSavings has adjusted value');
        assert.ok(results.endOfLifeSavings.nominal > 0, 'Nominal end of life savings is positive');
        assert.ok(results.endOfLifeSavings.adjusted > 0, 'Adjusted end of life savings is positive');
    });
});

QUnit.module('Retirement Calculations Edge Cases', function() {
    QUnit.test('Edge case: Very short retirement period', function(assert) {
        const inputs = {
            currentAge: 64,
            retirementAge: 65,
            lifeExpectancy: 66,
            returnRate: 0.07,
            inflationRate: 0.02,
            initialInvestment: 1000000,
            contributionAmount: 0,
            contributionInterval: 'annually',
            withdrawalAmount: 50000,
            inflationAdjustedWithdrawal: false,
            investmentStrategy: 'balanced'
        };

        const results = calculateRetirement(inputs);

        assert.equal(results.yearlyResults.length, 3, 'Correct number of years calculated');
        assert.ok(results.yearlyResults[2].balance > 0, 'Still has positive balance at end of life');
        assert.ok(results.retirementSavings.nominal > 0, 'Positive retirement savings');
        assert.ok(results.endOfLifeSavings.nominal > 0, 'Positive end of life savings');
    });

    QUnit.test('Edge case: High inflation scenario', function(assert) {
        const inputs = {
            currentAge: 30,
            retirementAge: 65,
            lifeExpectancy: 90,
            returnRate: 0.07,
            inflationRate: 0.1,
            initialInvestment: 100000,
            contributionAmount: 10000,
            contributionInterval: 'annually',
            withdrawalAmount: 50000,
            inflationAdjustedWithdrawal: true,
            investmentStrategy: 'balanced'
        };

        const results = calculateRetirement(inputs);

        assert.ok(results.yearlyResults[results.yearlyResults.length - 1].balance < results.yearlyResults[35].balance, 'Balance decreases in retirement due to high inflation');
        assert.ok(results.endOfLifeSavings.adjusted < results.retirementSavings.adjusted, 'Inflation-adjusted end of life savings less than retirement savings');
    });

    QUnit.test('Edge case: Negative return rate', function(assert) {
        const inputs = {
            currentAge: 30,
            retirementAge: 65,
            lifeExpectancy: 90,
            returnRate: -0.02,
            inflationRate: 0.02,
            initialInvestment: 1000000,
            contributionAmount: 20000,
            contributionInterval: 'annually',
            withdrawalAmount: 40000,
            inflationAdjustedWithdrawal: false,
            investmentStrategy: 'balanced'
        };

        const results = calculateRetirement(inputs);

        assert.ok(results.yearlyResults[results.yearlyResults.length - 1].balance < inputs.initialInvestment, 'Final balance is less than initial investment due to negative returns');
        assert.ok(results.endOfLifeSavings.nominal < results.retirementSavings.nominal, 'End of life savings less than retirement savings');
    });
});
