'use strict';

const {
    parse,
    differenceInDays,
    subMonths,
    endOfMonth,
    isAfter
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
 * @returns {object} The income stability score, average monthly income, and the list of income transactions.
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
            average_monthly_income: 0,
            incomeTransactions: []
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
        average_monthly_income: parseFloat(average_monthly_income.toFixed(2)),
        incomeTransactions
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
 * Calculates the Behavioral Savings Rate.
 * @param {Array<object>} transactions - The list of all transactions.
 * @param {number} average_monthly_income - The average monthly income.
 * @param {Array<object>} incomeTransactions - The identified income transactions.
 * @returns {number} The savings rate as a percentage.
 */
function calculateBehavioralSavingsRate(transactions, average_monthly_income, incomeTransactions) {
    if (average_monthly_income <= 0) {
        return 0;
    }

    const debtKeywords = ['rata', 'credit', 'imprumut', 'leasing', 'card de credit', 'rambursare', 'dobanda', 'finantare', 'ipoteca', 'rate', 'credite', 'imprumuturi', 'leasinguri', 'carduri de credit', 'rambursari', 'dobanzi', 'finantari', 'ipoteci'];
    const burnRateKeywords = ['chirie', 'intretinere', 'rata', 'credit ipotecar', 'enel', 'engie', 'eon', 'apa nova', 'digi', 'orange', 'vodafone', 'telekom', 'mega image', 'lidl', 'kaufland', 'carrefour', 'auchan', 'profi', 'asigurare', 'allianz', 'groupama', 'generali', 'stb', 'metrou', 'cfr'];
    const excludedKeywords = [...debtKeywords, ...burnRateKeywords];

    const potentialSavingsTransactions = transactions
        .map(t => ({ ...t,
            parsedAmount: parseTransactionAmount(t.amount)
        }))
        .filter(t =>
            t.parsedAmount < 0 &&
            !excludedKeywords.some(k => t.description.toLowerCase().includes(k))
        );

    let totalSavings = 0;
    const processedIncomeDates = new Set();

    for (const incomeTx of incomeTransactions) {
        const incomeDate = new Date(incomeTx.made_on);
        if (processedIncomeDates.has(incomeTx.made_on)) {
            continue;
        }
        processedIncomeDates.add(incomeTx.made_on);

        const threeDaysAfter = new Date(incomeDate);
        threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);

        const savingsInWindow = potentialSavingsTransactions.filter(t => {
            const txDate = new Date(t.made_on);
            return txDate > incomeDate && txDate <= threeDaysAfter;
        });

        for (const s of savingsInWindow) {
            totalSavings += Math.abs(s.parsedAmount);
        }
    }

    if (incomeTransactions.length === 0) {
        return 0;
    }
    const firstDate = new Date(incomeTransactions[0].made_on);
    const lastDate = new Date(incomeTransactions[incomeTransactions.length - 1].made_on);
    const months = ((lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30.44)) + 1;
    const total_monthly_savings = totalSavings / months;

    const behavioral_savings_rate = (total_monthly_savings / average_monthly_income) * 100;

    return parseFloat(behavioral_savings_rate.toFixed(2));
}

/**
 * Calculates the Financial Cushion in months.
 * @param {Array<object>} transactions - The list of all transactions.
 * @param {Array<object>} accounts - The list of connected accounts.
 * @returns {number} The financial cushion in months.
 */
function calculateFinancialCushion(transactions, accounts) {
    const burnRateKeywords = ['chirie', 'intretinere', 'rata', 'credit ipotecar', 'enel', 'engie', 'eon', 'apa nova', 'digi', 'orange', 'vodafone', 'telekom', 'mega image', 'lidl', 'kaufland', 'carrefour', 'auchan', 'profi', 'asigurare', 'allianz', 'groupama', 'generali', 'stb', 'metrou', 'cfr'];
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    const burnTransactions = transactions
        .map(t => ({ ...t,
            parsedAmount: parseTransactionAmount(t.amount)
        }))
        .filter(t =>
            t.parsedAmount < 0 &&
            burnRateKeywords.some(k => t.description.toLowerCase().includes(k)) &&
            new Date(t.made_on) >= sixMonthsAgo
        );

    const totalBurn = burnTransactions.reduce((sum, t) => sum + Math.abs(t.parsedAmount), 0);
    const monthly_burn_rate = totalBurn / 6;

    if (monthly_burn_rate === 0) return 0;

    const endOfMonthBalances = [];
    const allParsedTransactions = transactions.map(t => ({ ...t,
        parsedAmount: parseTransactionAmount(t.amount)
    })).sort((a, b) => new Date(b.made_on) - new Date(a.made_on));

    for (let i = 1; i <= 6; i++) {
        const dateTarget = endOfMonth(subMonths(now, i));
        let monthEndBalance = 0;

        for (const account of accounts) {
            let currentBalance = account.balance;
            for (const transaction of allParsedTransactions) {
                if (transaction.account_id === account.id && isAfter(new Date(transaction.made_on), dateTarget)) {
                    currentBalance -= transaction.parsedAmount;
                }
            }
            monthEndBalance += currentBalance;
        }
        endOfMonthBalances.push(monthEndBalance);
    }

    const baseline_buffer = endOfMonthBalances.reduce((a, b) => a + b, 0) / endOfMonthBalances.length;
    const financial_cushion_months = baseline_buffer / monthly_burn_rate;

    return parseFloat(financial_cushion_months.toFixed(2));
}

/**
 * Generates financial health flags based on transactions.
 * @param {Array<object>} transactions - The list of all transactions.
 * @param {number} average_monthly_income - The average monthly income.
 * @param {number} behavioral_savings_rate - The calculated savings rate.
 * @returns {Array<object>} A list of flag objects.
 */
function generateFlags(transactions, average_monthly_income, behavioral_savings_rate) {
    const flags = [];
    const allParsedTransactions = transactions.map(t => ({ ...t,
        parsedAmount: parseTransactionAmount(t.amount)
    }));
    const now = new Date();

    // Green Flags
    if (behavioral_savings_rate > 10) {
        flags.push({
            flag_type: 'CONSISTENT_SAVINGS',
            severity: 'Positive',
            category: 'green',
            description: `Applicant consistently saves more than 10% of their net income. (Rate: ${behavioral_savings_rate}%)`
        });
    }

    // Red Flags
    const paydayLenders = ['viva credit', 'icredit', 'ocean credit', 'provident'];
    const paydayLoanTransactions = allParsedTransactions.filter(t => paydayLenders.some(l => t.description.toLowerCase().includes(l)));
    if (paydayLoanTransactions.length > 0) {
        flags.push({
            flag_type: 'PAYDAY_LOAN_USAGE',
            severity: 'High',
            category: 'red',
            description: 'Applicant has used one or more payday loan services.',
            evidence: paydayLoanTransactions.map(t => ({
                date: t.made_on,
                description: t.description,
                amount: t.parsedAmount
            })),
        });
    }

    const gamblingMerchants = ['superbet', 'casa pariurilor', 'favbet', 'unibet', 'maxbet'];
    const gamblingTransactions = allParsedTransactions.filter(t => t.parsedAmount < 0 && gamblingMerchants.some(m => t.description.toLowerCase().includes(m)));
    if (gamblingTransactions.length > 0 && average_monthly_income > 0) {
        const monthlySpend = {};
        for (const t of gamblingTransactions) {
            const month = t.made_on.substring(0, 7);
            if (!monthlySpend[month]) monthlySpend[month] = 0;
            monthlySpend[month] += Math.abs(t.parsedAmount);
        }
        for (const month in monthlySpend) {
            if (monthlySpend[month] > (0.10 * average_monthly_income)) {
                flags.push({
                    flag_type: 'HIGH_GAMBLING_SPEND',
                    severity: 'High',
                    category: 'red',
                    description: `More than 10% of net income was spent on gambling in a single month (${month}).`,
                    evidence: gamblingTransactions.filter(t => t.made_on.substring(0, 7) === month).map(t => ({
                        date: t.made_on,
                        description: t.description,
                        amount: t.parsedAmount
                    })),
                });
                break;
            }
        }
    }

    const overdraftKeywords = ['comision descoperire', 'penalizare', 'refuz la plata', 'lipsa disponibil'];
    const threeMonthsAgo = subMonths(now, 3);
    const overdraftTransactions = allParsedTransactions.filter(t => new Date(t.made_on) >= threeMonthsAgo && overdraftKeywords.some(k => t.description.toLowerCase().includes(k)));
    if (overdraftTransactions.length > 2) {
        flags.push({
            flag_type: 'FREQUENT_OVERDRAFTS',
            severity: 'Medium',
            category: 'red',
            description: 'More than 2 overdraft-related fees or events found in the last 3 months.',
            evidence: overdraftTransactions.map(t => ({
                date: t.made_on,
                description: t.description,
                amount: t.parsedAmount
            })),
        });
    }

    return flags;
}


/**
 * Processes the affordability V4 calculations.
 * @param {Array<object>} transactions - The list of transactions from Salt Edge.
 * @param {Array<object>} accounts - The list of accounts from Salt Edge.
 * @returns {object} An object containing the V4 metrics.
 */
const processAffordability = (transactions, accounts) => {
    const {
        income_stability_score,
        average_monthly_income,
        incomeTransactions
    } = calculateIncomeStability(transactions);

    const enhanced_dti_ratio = calculateDtiRatio(transactions, average_monthly_income);

    // V4 Advanced Analytics
    const behavioral_savings_rate = calculateBehavioralSavingsRate(transactions, average_monthly_income, incomeTransactions);
    const financial_cushion_months = calculateFinancialCushion(transactions, accounts);
    const flags = generateFlags(transactions, average_monthly_income, behavioral_savings_rate);

    return {
        income_stability_score,
        enhanced_dti_ratio,
        average_monthly_income,
        behavioral_savings_rate,
        financial_cushion_months,
        flags
    };
};

module.exports = {
    processAffordability,
};
