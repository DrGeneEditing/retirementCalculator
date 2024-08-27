// Utility Functions
function parseNumber(value) {
    const cleanValue = value.replace(/[$,]/g, '');
    const number = parseFloat(cleanValue);
    if (isNaN(number)) {
        throw new Error('Invalid number input');
    }
    return number;
}

function formatCurrency(value, useShorthand = false) {
    if (useShorthand) {
        if (value >= 1e6) {
            return `$${(value / 1e6).toFixed(1)}M`;
        } else if (value >= 1e3) {
            return `$${(value / 1e3).toFixed(1)}K`;
        }
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// Core Calculation Function
function calculateRetirement(inputs) {
    let results = [];
    let balance = inputs.initialInvestment;
    let annualContribution = inputs.contributionAmount;
    
    if (inputs.contributionInterval === 'monthly') {
        annualContribution *= 12;
    } else if (inputs.contributionInterval === 'quarterly') {
        annualContribution *= 4;
    }

    let retirementSavings = {
        nominal: 0,
        adjusted: 0
    };
    let endOfLifeSavings = {
        nominal: 0,
        adjusted: 0
    };

    for (let age = inputs.currentAge; age <= inputs.lifeExpectancy; age++) {
        const year = age - inputs.currentAge;
        const isRetired = age >= inputs.retirementAge;

        let withdrawal = 0;
        if (isRetired) {
            withdrawal = inputs.inflationAdjustedWithdrawal 
                ? inputs.withdrawalAmount * Math.pow(1 + inputs.inflationRate, year)
                : inputs.withdrawalAmount;
        }

        if (year > 0) {
            let returnRate = inputs.returnRate;
            
            // Apply investment strategy
            switch(inputs.investmentStrategy) {
                case 'Worst Case':
                    returnRate = Math.max(returnRate - 0.03, 0.02); // Lower return, minimum 2%
                    break;
                case 'Best Case':
                    returnRate = returnRate + 0.03; // Higher return
                    break;
                // 'balanced' uses the default returnRate
            }

            balance = (balance + (isRetired ? 0 : annualContribution) - withdrawal) * (1 + returnRate);
        }
        
        const inflationAdjustedBalance = balance / Math.pow(1 + inputs.inflationRate, year);

        if (age === inputs.retirementAge) {
            retirementSavings.nominal = balance;
            retirementSavings.adjusted = inflationAdjustedBalance;
        }

        results.push({
            age,
            annualContribution: isRetired ? 0 : annualContribution,
            withdrawal,
            balance,
            inflationAdjustedBalance
        });
    }

    endOfLifeSavings.nominal = results[results.length - 1].balance;
    endOfLifeSavings.adjusted = results[results.length - 1].inflationAdjustedBalance;

    return {
        yearlyResults: results,
        retirementSavings,
        endOfLifeSavings
    };
}

// UI Interaction Functions
function getInputs() {
    return {
        currentAge: parseNumber(document.getElementById('current-age').value),
        retirementAge: parseNumber(document.getElementById('retirement-age').value),
        lifeExpectancy: parseNumber(document.getElementById('life-expectancy').value),
        returnRate: parseNumber(document.getElementById('return-rate').value) / 100,
        inflationRate: parseNumber(document.getElementById('inflation-rate').value) / 100,
        initialInvestment: parseNumber(document.getElementById('initial-investment').value),
        contributionAmount: parseNumber(document.getElementById('contribution-amount').value),
        contributionInterval: document.getElementById('contribution-interval').value,
        withdrawalAmount: parseNumber(document.getElementById('withdrawal-amount').value),
        inflationAdjustedWithdrawal: document.getElementById('inflation-adjusted-withdrawal').checked,
        investmentStrategy: document.getElementById('investment-strategy').value
    };
}

function displayResults(results, inputs) {
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';

    displaySummary(results, inputs);
    displayBalanceChart(results.yearlyResults);
    displayWithdrawalChart(results.yearlyResults, inputs);
    displayTable(results.yearlyResults);
}

function displaySummary(results, inputs) {
    document.getElementById('total-savings').textContent = formatCurrency(results.retirementSavings.nominal);
    document.getElementById('adjusted-savings').textContent = formatCurrency(results.retirementSavings.adjusted);
    document.getElementById('total-savings-end').textContent = formatCurrency(results.endOfLifeSavings.nominal);
    document.getElementById('adjusted-savings-end').textContent = formatCurrency(results.endOfLifeSavings.adjusted);
}

let balanceChart = null;
let withdrawalChart = null;

function displayBalanceChart(results) {
    const ctx = document.getElementById('balance-chart').getContext('2d');
    const labels = results.map(r => r.age);
    const nominalData = results.map(r => r.balance);
    const adjustedData = results.map(r => r.inflationAdjustedBalance);

    if (balanceChart) {
        balanceChart.destroy();
    }

    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nominal Balance',
                data: nominalData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'Inflation-Adjusted Balance',
                data: adjustedData,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value, true);
                        }
                    }
                }
            }
        }
    });
}

function displayWithdrawalChart(results, inputs) {
    const ctx = document.getElementById('withdrawal-chart').getContext('2d');
    const labels = results.map(r => r.age);
    const withdrawalData = results.map(r => r.withdrawal);

    if (withdrawalChart) {
        withdrawalChart.destroy();
    }

    withdrawalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Annual Withdrawal',
                data: withdrawalData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value, true);
                        }
                    }
                }
            }
        }
    });
}

function displayTable(results) {
    const tbody = document.querySelector('#results-table tbody');
    tbody.innerHTML = '';

    results.forEach(result => {
        const row = tbody.insertRow();
        row.insertCell().textContent = result.age;
        row.insertCell().textContent = formatCurrency(result.annualContribution);
        row.insertCell().textContent = formatCurrency(result.withdrawal);
        row.insertCell().textContent = formatCurrency(result.balance);
        row.insertCell().textContent = formatCurrency(result.inflationAdjustedBalance);
    });
}

// Main Function
function initRetirementPlanner() {
    const form = document.getElementById('retirement-form');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            try {
                const inputs = getInputs();
                const results = calculateRetirement(inputs);
                displayResults(results, inputs);
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    } else {
        console.error('Retirement form not found in the document');
    }
}

// Initialize the planner when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRetirementPlanner);
} else {
    initRetirementPlanner();
}

// Expose functions for testing
if (typeof window !== 'undefined') {
    window.parseNumber = parseNumber;
    window.formatCurrency = formatCurrency;
    window.calculateRetirement = calculateRetirement;
    window.getInputs = getInputs;
}
