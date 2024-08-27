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
            inflationAdjustedWithdrawal: false
        };

        const results = calculateRetirement(inputs);

        assert.equal(results.length, 61, 'Correct number of years calculated');
        assert.equal(results[0].age, 30, 'First year age is correct');
        assert.equal(results[0].balance, 10000, 'First year balance is initial investment');
        
        const expectedSecondYearBalance = (10000 + 5000) * 1.07;
        const tolerance = 0.01; // 1% tolerance
        assert.ok(
            Math.abs(results[1].balance - expectedSecondYearBalance) <= tolerance * expectedSecondYearBalance,
            'Second year balance calculation is correct within 1% tolerance'
        );
        
        assert.equal(results[35].age, 65, 'Retirement age is correct');
        assert.ok(results[35].withdrawal > 0, 'Withdrawals start at retirement age');
        assert.equal(results[35].annualContribution, 0, 'Contributions stop at retirement age');
        
        assert.equal(results[60].age, 90, 'Final year age is correct');
        assert.ok(results[60].balance > 0, 'Final balance is positive');
    });
});

// ... (keep existing tests)

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
            inflationAdjustedWithdrawal: false
        };

        const results = calculateRetirement(inputs);

        assert.equal(results.length, 3, 'Correct number of years calculated');
        assert.ok(results[2].balance > 0, 'Still has positive balance at end of life');
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
            inflationAdjustedWithdrawal: true
        };

        const results = calculateRetirement(inputs);

        assert.ok(results[results.length - 1].balance < results[35].balance, 'Balance decreases in retirement due to high inflation');
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
            inflationAdjustedWithdrawal: false
        };

        const results = calculateRetirement(inputs);

        assert.ok(results[results.length - 1].balance < inputs.initialInvestment, 'Final balance is less than initial investment due to negative returns');
    });
});
