'use strict';

const {
    parse,
    differenceInDays
} = require('date-fns');

/**
 * Parses a Salt Edge transaction amount into a standard decimal number.
 * @param {object} amountObject - The amount object from Salt Edge.
 * @returns {number} The parsed amount.
 */
function parseTransactionAmount(amountObject) {
    if (!amountObject || !amountObject.value || !amountObject.value.unscaledValue || !amountObject.value.scale) {
        return 0;
    }
    const {
        unscaledValue,
        scale
    } = amountObject.value;
    return parseFloat(unscaledValue) / (10 ** parseInt(scale, 10));
}

/**
 * Calculates the standard deviation of a list of numbers.
 * @param {Array<number>} numbers - A list of numbers.
 * @returns {number} The standard deviation.
 */
function standardDeviation(numbers) {
    if (numbers.length < 2) {
        return 0;
    }
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + (b - mean) ** 2, 0) / (numbers.length - 1);
    return Math.sqrt(variance);
}

/**
 * Calculates the Income Stability Score.
 * @param {Array<object>} transactions - The list of transactions.
 * @returns {object} The income stability score and average monthly income.
 */
function calculateIncomeStability(transactions) {
    const incomeKeywords = ['salariu', 'virament', 'incasare', 'venituri', 'plata', 'transfer', 'dividende', 'bonus', 'comision', 'onorariu', 'chirie', 'alocatie', 'pensii', 'indemnizatie', 'subventie'];
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const incomeTransactions = transactions
        .map(t => ({ ...t,
            parsedAmount: parseTransactionAmount(t.amount)
        }))
        .filter(t => t.parsedAmount > 0 &&
            incomeKeywords.some(k => t.description.toLowerCase().includes(k)) &&
            new Date(t.made_on) >= twelveMonthsAgo
        )
        .sort((a, b) => new Date(a.made_on) - new Date(b.made_on));

    if (incomeTransactions.length < 2) {
        return {
            income_stability_score: 0,
            average_monthly_income: 0
        };
    }

    const incomeAmounts = incomeTransactions.map(t => t.parsedAmount);
    const meanIncome = incomeAmounts.reduce((a, b) => a + b, 0) / incomeAmounts.length;
    const stdDevIncome = standardDeviation(incomeAmounts);
    const cov = meanIncome > 0 ? stdDevIncome / meanIncome : 1;

    const normalizedAmountStability = 1 - Math.min(cov, 1);

    const dateDiffs = [];
    for (let i = 1; i < incomeTransactions.length; i++) {
        const date1 = parse(incomeTransactions[i - 1].made_on, 'yyyy-MM-dd', new Date());
        const date2 = parse(incomeTransactions[i].made_on, 'yyyy-MM-dd', new Date());
        dateDiffs.push(differenceInDays(date2, date1));
    }

    const stdDevFrequency = standardDeviation(dateDiffs);
    const normalizedFrequencyStability = Math.max(0, 1 - (stdDevFrequency / 7));

    const income_stability_score = (normalizedAmountStability * 0.7 + normalizedFrequencyStability * 0.3) * 100;

    const totalIncome = incomeAmounts.reduce((a, b) => a + b, 0);
    const months = (new Date(incomeTransactions[incomeTransactions.length - 1].made_on) - new Date(incomeTransactions[0].made_on)) / (1000 * 60 * 60 * 24 * 30.44);
    const average_monthly_income = months > 0 ? totalIncome / months : totalIncome;


    return {
        income_stability_score: parseFloat(income_stability_score.toFixed(2)),
        average_monthly_income: parseFloat(average_monthly_income.toFixed(2))
    };
}

/**
 * Calculates the Enhanced DTI Ratio.
 * @param {Array<object>} transactions - The list of transactions.
 * @param {number} averageMonthlyIncome - The average monthly income.
 * @returns {number} The enhanced DTI ratio.
 */
function calculateDtiRatio(transactions, averageMonthlyIncome) {
    if (averageMonthlyIncome <= 0) {
        return 0;
    }

    const debtKeywords = ['rata', 'credit', 'imprumut', 'leasing', 'card de credit', 'rambursare', 'dobanda', 'finantare', 'ipoteca', 'rate', 'credite', 'imprumuturi', 'leasinguri', 'carduri de credit', 'rambursari', 'dobanzi', 'finantari', 'ipoteci'];
    const financialInstitutions = ['bcr', 'brd', 'banca transilvania', 'ing bank', 'raiffeisen bank', 'cec bank', 'unicredit bank', 'ocean credit', 'icredit romania', 'viva credit ifn', 'provident'];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    const debtTransactions = transactions
        .map(t => ({ ...t,
            parsedAmount: parseTransactionAmount(t.amount)
        }))
        .filter(t => t.parsedAmount < 0 &&
            (debtKeywords.some(k => t.description.toLowerCase().includes(k)) ||
                financialInstitutions.some(fi => t.description.toLowerCase().includes(fi))) &&
            new Date(t.made_on) >= threeMonthsAgo
        );

    if (debtTransactions.length === 0) {
        return 0;
    }

    const totalDebt = debtTransactions.reduce((sum, t) => sum + Math.abs(t.parsedAmount), 0);
    const monthlyDebt = totalDebt / 3;

    const enhanced_dti_ratio = (monthlyDebt / averageMonthlyIncome) * 100;

    return parseFloat(enhanced_dti_ratio.toFixed(2));
}

/**
 * Processes the affordability V4 calculations.
 * @param {Array<object>} transactions - The list of transactions from Salt Edge.
 * @returns {object} An object containing the V4 metrics.
 */
const processAffordability = (transactions) => {
    const {
        income_stability_score,
        average_monthly_income
    } = calculateIncomeStability(transactions);
    const enhanced_dti_ratio = calculateDtiRatio(transactions, average_monthly_income);

    return {
        income_stability_score,
        enhanced_dti_ratio,
        average_monthly_income,
    };
};

module.exports = {
    processAffordability,
};
