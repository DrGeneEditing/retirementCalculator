// Get form inputs and results table
const form = document.getElementById('retirement-form');
const resultsTable = document.getElementById('results-table');
const chartContainer = document.getElementById('chart-container');

// Add event listener for form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateRetirement();
});

// Function to calculate retirement
function calculateRetirement() {
    // Get input values
    const currentAge = parseInt(document.getElementById('current-age').value);
    const retirementAge = parseInt(document.getElementById('retirement-age').value);
    const returnRate = parseFloat(document.getElementById('return-rate').value) / 100;
    const nestEgg = parseFloat(document.getElementById('nest-egg').value);
    const annualInvestments = parseFloat(document.getElementById('annual-investments').value);
    const withdrawalType = document.getElementById('withdrawal-type').value;
    const withdrawalAmount = parseFloat(document.getElementById('withdrawal-amount').value);
    const withdrawalIncreaseType = document.getElementById('withdrawal-increase-type').value;
    const withdrawalIncreaseRate = parseFloat(document.getElementById('withdrawal-increase-rate').value) / 100;
    const lifeExpectancy = parseInt(document.getElementById('life-expectancy').value);
    const inflationRate = parseFloat(document.getElementById('inflation-rate').value) / 100;

    // Calculate retirement
    const years = lifeExpectancy - currentAge;
    const data = [];
    let balance = nestEgg;

    for (let i = 0; i < years; i++) {
        const age = currentAge + i;
        const inflation = Math.pow(1 + inflationRate, i);
        const investment = age < retirementAge ? annualInvestments : 0;
        let withdrawal = 0;

        if (age >= retirementAge) {
            if (withdrawalType === 'amount') {
                withdrawal = withdrawalAmount;
            } else {
                withdrawal = balance * (withdrawalAmount / 100);
            }

            if (withdrawalIncreaseType === 'inflation') {
                withdrawal *= inflation;
            } else if (withdrawalIncreaseType === 'fixed') {
                withdrawal *= Math.pow(1 + withdrawalIncreaseRate, i - (retirementAge - currentAge));
            }
        }

        balance = (balance + investment) * (1 + returnRate) - withdrawal;

        data.push({
            age,
            balance: balance.toFixed(2),
            inflationAdjustedBalance: (balance / inflation).toFixed(2),
            withdrawal: withdrawal.toFixed(2),
                    inflationAdjustedWithdrawal: (withdrawal / inflation).toFixed(2),
        });
    }

    // Clear previous results
    resultsTable.innerHTML = '';
    chartContainer.innerHTML = '';

    // Render results table
    const tableHeader = `
        <tr>
            <th>Age</th>
            <th>Balance</th>
            <th>Inflation-Adjusted Balance</th>
            <th>Withdrawal</th>
            <th>Inflation-Adjusted Withdrawal</th>
        </tr>
    `;
    const tableRows = data
        .map(
            (row) => `
        <tr>
            <td>${row.age}</td>
            <td>$${parseFloat(row.balance).toLocaleString()}</td>
            <td>$${parseFloat(row.inflationAdjustedBalance).toLocaleString()}</td>
            <td>$${parseFloat(row.withdrawal).toLocaleString()}</td>
             <td>$${parseFloat(row.inflationAdjustedWithdrawal).toLocaleString()}</td>
        </tr>
    `
        )
        .join('');
    resultsTable.innerHTML = tableHeader + tableRows;

    // Render charts
    const labels = data.map((row) => row.age);
    const balanceData = data.map((row) => row.balance);
    const inflationAdjustedBalanceData = data.map((row) => row.inflationAdjustedBalance);
    const withdrawalData = data.map((row) => row.withdrawal);
    const inflationAdjustedWithdrawalData = data.map((row) => row.inflationAdjustedWithdrawal);

    const balanceChart = new Chart(document.createElement('canvas'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Balance',
                    data: balanceData,
                    borderColor: 'blue',
                    fill: false,
                },
                {
                    label: 'Inflation-Adjusted Balance',
                    data: inflationAdjustedBalanceData,
                    borderColor: 'green',
                    fill: false,
                },
            ],
        },
    });

    const withdrawalChart = new Chart(document.createElement('canvas'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Withdrawal',
                    data: withdrawalData,
                    borderColor: 'red',
                    fill: false,
                },
                {
                    label: 'Inflation-Adjusted Withdrawal',
                    data: inflationAdjustedWithdrawalData,
                    borderColor: 'orange',
                    fill: false,
                },
            ],
        },
    });

    chartContainer.appendChild(balanceChart.canvas);
    chartContainer.appendChild(withdrawalChart.canvas);
}