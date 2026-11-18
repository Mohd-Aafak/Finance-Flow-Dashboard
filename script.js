// ===============================
// GET HTML ELEMENTS
// ===============================

const form = document.getElementById("form");
const title = document.getElementById("title");
const amount = document.getElementById("amount");
const category = document.getElementById("category");

const totalIncome = document.getElementById("total-income");
const totalExpense = document.getElementById("total-expense");
const balance = document.getElementById("balance");

const submitTransBtn = document.getElementById("transaction-btn");
const transactionList = document.getElementById("transaction-list");

const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const filterExpenseCategory = document.getElementById(
    "filter-expense-category"
);

const sortTransactions = document.getElementById("sort-transactions");
const filterDate = document.getElementById("filter-date");
const clearFilters = document.getElementById("clear-filters");

const exportBtn = document.getElementById("export-btn");
const importFile = document.getElementById("import-file");
const importBtn = document.getElementById("import-btn");

const monthFilter = document.getElementById("month-filter");

const monthlyIncome = document.getElementById("monthly-income");
const monthlyExpense = document.getElementById("monthly-expense");
const monthlyBalance = document.getElementById("monthly-balance");

const budgetInput = document.getElementById("budget-input");
const saveBudgetBtn = document.getElementById("save-budget");

const totalBudget = document.getElementById("total-budget");
const budgetSpent = document.getElementById("budget-spent");
const budgetRemaining = document.getElementById("budget-remaining");
const budgetAlert = document.getElementById("budget-alert");

const budgetProgressFill = document.getElementById("budget-progress-fill");
const budgetProgressText = document.getElementById("budget-progress-text");

const expenseCategory = document.getElementById("expense-category");
const cancelEditBtn = document.getElementById("cancel-edit");

// ===============================
// CURRENT MONTH
// ===============================

const currentMonth = new Date().toISOString().slice(0, 7);

if (!monthFilter.value) {
    monthFilter.value = currentMonth;
}


// ===============================
// LOAD TRANSACTIONS
// ===============================

let transactions = [];

try {
    const savedTransactions = JSON.parse(
        localStorage.getItem("transactions")
    );

    transactions = Array.isArray(savedTransactions)
        ? savedTransactions
        : [];
} catch (error) {
    transactions = [];
}

let editIndex = null;


// ===============================
// MONTHLY BUDGET
// ===============================

function getBudgetKey() {
    return `monthlyBudget-${monthFilter.value || currentMonth}`;
}

let monthlyBudget = Number(localStorage.getItem(getBudgetKey())) || 0;

budgetInput.value = monthlyBudget || "";

totalBudget.textContent = `₹${monthlyBudget.toFixed(2)}`;


// ===============================
// MONTHLY INCOME VS EXPENSE CHART
// ===============================

const chartCanvas = document.getElementById("monthly-chart");

let monthlyChart = null;

if (chartCanvas && typeof Chart !== "undefined") {
    monthlyChart = new Chart(chartCanvas, {
        type: "bar",

        data: {
            labels: [],

            datasets: [
                {
                    label: "Income",
                    data: [],
                    backgroundColor: "#667eea",
                    borderRadius: 6
                },

                {
                    label: "Expense",
                    data: [],
                    backgroundColor: "#f093fb",
                    borderRadius: 6
                }
            ]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "top"
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ": ₹" +
                                Number(context.parsed.y).toLocaleString("en-IN");
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: function(value) {
                            return "₹" +
                                Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}


// ===============================
// CATEGORY DOUGHNUT CHART
// ===============================

const categoryCanvas = document.getElementById("category-chart");

let categoryChart = null;

if (categoryCanvas && typeof Chart !== "undefined") {
    categoryChart = new Chart(categoryCanvas, {
        type: "doughnut",

        data: {
            labels: [],

            datasets: [
                {
                    data: [],

                    backgroundColor: [
                        "#667eea",
                        "#764ba2",
                        "#f093fb",
                        "#4facfe",
                        "#43e97b",
                        "#fa709a"
                    ]
                }
            ]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// ===============================
// ADD AND EDIT TRANSACTION
// ===============================

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const titleValue = title.value.trim();
    const amountValue = Number(amount.value);
    const categoryValue = category.value;
    const expenseCategoryValue = expenseCategory.value;


if (
    titleValue === "" ||
    amount.value.trim() === "" ||
    !Number.isFinite(amountValue) ||
    amountValue <= 0 ||
    categoryValue === ""
) {
    alert("Please enter a valid title, amount and transaction type!");
    return;
}

if (
    categoryValue === "Expense" &&
    expenseCategoryValue === ""
) {
    alert("Please select an expense category!");
    expenseCategory.focus();
    return;
}


    const oldTransaction =
        editIndex !== null ? transactions[editIndex] : null;

    const transaction = {
        title: titleValue,
        amount: amountValue,
        category: categoryValue,

        expenseCategory: categoryValue === "Expense"
            ? expenseCategoryValue || "Other"
            : "",

        date: oldTransaction
            ? oldTransaction.date || new Date().toISOString()
            : new Date().toISOString()
    };

    if (editIndex === null) {
        transactions.push(transaction);
    } else {
        transactions[editIndex] = transaction;

        editIndex = null;

        submitTransBtn.textContent = "Add Transaction";
    }

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

    form.reset();

    cancelEditBtn.hidden = true; 
    filterTransactions();
    updateSummary();
    updateMonthlySummary();
    updateBudgetSummary();
    updateMonthlyChart();
    updateCategoryChart();
});


// ===============================
// OVERALL SUMMARY
// ===============================

function updateSummary() {
    const incomeSum = transactions
        .filter(transaction => transaction.category === "Deposit")
        .reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0
        );

    const expenseSum = transactions
        .filter(transaction => transaction.category === "Expense")
        .reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0
        );

    totalIncome.textContent = `₹${incomeSum.toFixed(2)}`;

    totalExpense.textContent = `₹${expenseSum.toFixed(2)}`;

    balance.textContent = `₹${(incomeSum - expenseSum).toFixed(2)}`;
}


// ===============================
// MONTHLY SUMMARY
// ===============================

function updateMonthlySummary() {
    const selectedMonth = monthFilter.value || currentMonth;

    const monthlyTransactions = transactions.filter(transaction => {
        return transaction.date &&
            transaction.date.slice(0, 7) === selectedMonth;
    });

    const income = monthlyTransactions
        .filter(transaction => transaction.category === "Deposit")
        .reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0
        );

    const expense = monthlyTransactions
        .filter(transaction => transaction.category === "Expense")
        .reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0
        );

    monthlyIncome.textContent = `₹${income.toFixed(2)}`;

    monthlyExpense.textContent = `₹${expense.toFixed(2)}`;

    monthlyBalance.textContent = `₹${(income - expense).toFixed(2)}`;
}


// ===============================
// MONTHLY BUDGET SUMMARY
// ===============================

function updateBudgetSummary() {
    const selectedMonth = monthFilter.value || currentMonth;

    const spent = transactions
        .filter(transaction =>
            transaction.category === "Expense" &&
            transaction.date &&
            transaction.date.slice(0, 7) === selectedMonth
        )
        .reduce(
            (sum, transaction) => sum + Number(transaction.amount),
            0
        );

    const remaining = monthlyBudget - spent;

    totalBudget.textContent = `₹${monthlyBudget.toFixed(2)}`;

    budgetSpent.textContent = `₹${spent.toFixed(2)}`;

    budgetRemaining.textContent = `₹${remaining.toFixed(2)}`;

    budgetRemaining.style.color = remaining < 0 ? "red" : "green";

    if (monthlyBudget <= 0) {
        budgetAlert.textContent = "Set a budget to get started!";
        budgetAlert.style.color = "";
    } else if (spent >= monthlyBudget) {
        budgetAlert.textContent = "⚠️ Budget exceeded!";
        budgetAlert.style.color = "red";
    } else if (spent >= monthlyBudget * 0.8) {
        budgetAlert.textContent = "⚠️ You have used 80% of your budget!";
        budgetAlert.style.color = "orange";
    } else {
        budgetAlert.textContent = "You're within your budget!";
        budgetAlert.style.color = "green";
    }

    const percentage = monthlyBudget > 0
        ? (spent / monthlyBudget) * 100
        : 0;

    budgetProgressFill.style.width =
        `${Math.min(percentage, 100)}%`;

    budgetProgressText.textContent =
        `${Math.round(percentage)}% used`;

    if (percentage >= 100) {
        budgetProgressFill.style.background = "red";
    } else if (percentage >= 80) {
        budgetProgressFill.style.background = "orange";
    } else {
        budgetProgressFill.style.background = "#667eea";
    }
}


// ===============================
// RENDER TRANSACTIONS
// ===============================

function renderTransaction(data = transactions) {
    transactionList.innerHTML = "";

    if (data.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.textContent = "No transactions found.";

        transactionList.appendChild(emptyMessage);

        return;
    }

    data.forEach(transaction => {
        const type = transaction.category === "Deposit"
            ? "income"
            : "expense";

        const index = transactions.indexOf(transaction);

        const displayDate = transaction.date
            ? new Date(transaction.date).toLocaleDateString("en-IN")
            : "Date not available";

        const card = document.createElement("div");

        card.className = `transaction-card ${type}`;

        const details = document.createElement("div");

        const info = document.createElement("p");

        info.textContent =
            `${transaction.title} - ₹${transaction.amount} - ${transaction.category}`;

        if (
            transaction.category === "Expense" &&
            transaction.expenseCategory
        ) {
            const expenseType = document.createElement("small");

            expenseType.textContent =
                `Expense Category: ${transaction.expenseCategory}`;

            details.appendChild(expenseType);
        }

        const date = document.createElement("small");

        date.textContent = displayDate;

        details.prepend(info);
        details.appendChild(date);

        const deleteBtn = document.createElement("button");

        deleteBtn.textContent = "Delete";
        deleteBtn.dataset.index = index;

        const editBtn = document.createElement("button");

        editBtn.textContent = "Edit";
        editBtn.dataset.index = index;

        card.append(details, deleteBtn, editBtn);

        transactionList.appendChild(card);
    });
}


// ===============================
// DELETE AND EDIT TRANSACTIONS
// ===============================

transactionList.addEventListener("click", function(event) {
    if (event.target.tagName !== "BUTTON") {
        return;
    }

    const index = Number(event.target.dataset.index);

    if (!Number.isInteger(index) || !transactions[index]) {
        return;
    }

    if (event.target.textContent === "Delete") {
        transactions.splice(index, 1);

        if (editIndex === index) {
            editIndex = null;

            form.reset();

            submitTransBtn.textContent = "Add Transaction";
        } else if (editIndex !== null && index < editIndex) {
            editIndex--;
        }

        localStorage.setItem(
            "transactions",
            JSON.stringify(transactions)
        );

        filterTransactions();
        updateSummary();
        updateMonthlySummary();
        updateBudgetSummary();
        updateMonthlyChart();
        updateCategoryChart();

    } else if (event.target.textContent === "Edit") {
        editIndex = index;

        title.value = transactions[index].title;

        amount.value = transactions[index].amount;

        category.value = transactions[index].category;

        expenseCategory.value =
            transactions[index].expenseCategory || "";

        submitTransBtn.textContent = "Update Transaction";

        cancelEditBtn.hidden = false;
        title.focus();
    }
});
// Cancel Edit Transaction

cancelEditBtn.addEventListener("click", function() {
    editIndex = null;

    form.reset();

    submitTransBtn.textContent = "Add Transaction";

    cancelEditBtn.hidden = true;
});

// ===============================
// SEARCH, FILTERS AND SORTING
// ===============================

function filterTransactions() {
    const searchValue = searchInput.value.toLowerCase().trim();

    const categoryValue = filterCategory.value;

    const expenseCategoryValue = filterExpenseCategory.value;

    const dateValue = filterDate.value;

    const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = transaction.date
            ? transaction.date.slice(0, 10)
            : "";

        const matchesSearch = String(transaction.title)
            .toLowerCase()
            .includes(searchValue);

        const matchesType =
            categoryValue === "All" ||
            transaction.category === categoryValue;

        const matchesExpenseCategory =
            expenseCategoryValue === "" ||
            expenseCategoryValue === "All" ||
            (
                transaction.category === "Expense" &&
                (transaction.expenseCategory || "Other") ===
                    expenseCategoryValue
            );

        const matchesDate =
            dateValue === "" || transactionDate === dateValue;

        return (
            matchesSearch &&
            matchesType &&
            matchesExpenseCategory &&
            matchesDate
        );
    });

    const sortValue = sortTransactions.value;

    if (sortValue === "high") {
        filteredTransactions.sort(
            (a, b) => Number(b.amount) - Number(a.amount)
        );
    } else if (sortValue === "low") {
        filteredTransactions.sort(
            (a, b) => Number(a.amount) - Number(b.amount)
        );
    } else if (sortValue === "newest") {
        filteredTransactions.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );
    } else if (sortValue === "oldest") {
        filteredTransactions.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
    }

    renderTransaction(filteredTransactions);
}


// Search and filter event listeners

searchInput.addEventListener("input", filterTransactions);

filterCategory.addEventListener("change", filterTransactions);

filterExpenseCategory.addEventListener("change", filterTransactions);

sortTransactions.addEventListener("change", filterTransactions);

filterDate.addEventListener("change", filterTransactions);


// ===============================
// CLEAR FILTERS
// ===============================

clearFilters.addEventListener("click", function() {
    searchInput.value = "";

    filterCategory.value = "All";

    filterExpenseCategory.value = "";

    sortTransactions.value = "newest";

    filterDate.value = "";

    filterTransactions();
});


// ===============================
// CHANGE MONTH
// ===============================

monthFilter.addEventListener("change", function() {
    monthlyBudget = Number(localStorage.getItem(getBudgetKey())) || 0;

    budgetInput.value = monthlyBudget || "";

    updateMonthlySummary();

    updateBudgetSummary();

    updateMonthlyChart();

    updateCategoryChart();
});


// ===============================
// SAVE MONTHLY BUDGET
// ===============================

saveBudgetBtn.addEventListener("click", function() {
    const budgetValue = Number(budgetInput.value);

    if (
        budgetInput.value.trim() === "" ||
        !Number.isFinite(budgetValue) ||
        budgetValue <= 0
    ) {
        alert("Please enter a valid budget!");
        return;
    }

    monthlyBudget = budgetValue;

    localStorage.setItem(
        getBudgetKey(),
        String(monthlyBudget)
    );

    updateBudgetSummary();

    alert("Budget saved successfully!");
});


// ===============================
// UPDATE MONTHLY CHART
// ===============================

function updateMonthlyChart() {
    if (!monthlyChart) {
        return;
    }

    const selectedMonth = monthFilter.value || currentMonth;

    const monthlyTransactions = transactions.filter(transaction =>
        transaction.date &&
        transaction.date.slice(0, 7) === selectedMonth
    );

    let income = 0;

    let expense = 0;

    monthlyTransactions.forEach(transaction => {
        if (transaction.category === "Deposit") {
            income += Number(transaction.amount);
        } else if (transaction.category === "Expense") {
            expense += Number(transaction.amount);
        }
    });

    monthlyChart.data.labels = [selectedMonth];

    monthlyChart.data.datasets[0].data = [income];

    monthlyChart.data.datasets[1].data = [expense];

    monthlyChart.update();
}


// ===============================
// UPDATE CATEGORY CHART
// ===============================

function updateCategoryChart() {
    if (!categoryChart) {
        return;
    }

    const selectedMonth = monthFilter.value || currentMonth;

    const categoryTotals = {};

    transactions.forEach(transaction => {
        if (
            transaction.category !== "Expense" ||
            !transaction.date ||
            transaction.date.slice(0, 7) !== selectedMonth
        ) {
            return;
        }

        const categoryName = transaction.expenseCategory || "Other";

        categoryTotals[categoryName] =
            (categoryTotals[categoryName] || 0) +
            Number(transaction.amount);
    });

    categoryChart.data.labels = Object.keys(categoryTotals);

    categoryChart.data.datasets[0].data =
        Object.values(categoryTotals);

    categoryChart.update();
}


// ===============================
// EXPORT TRANSACTIONS TO CSV
// ===============================

exportBtn.addEventListener("click", function() {
    const csvValue = value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    let csv =
        "Title,Amount,Category,Date,ExpenseCategory\n";

    transactions.forEach(transaction => {
        const row = [
            transaction.title,
            transaction.amount,
            transaction.category,
            transaction.date
                ? transaction.date.slice(0, 10)
                : "",
            transaction.expenseCategory || "Other"
        ];

        csv += row.map(csvValue).join(",") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "transactions.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
});


// ===============================
// IMPORT TRANSACTIONS FROM CSV
// ===============================

importBtn.addEventListener("click", function() {
    const file = importFile.files[0];

    if (!file) {
        alert("Please select a CSV file first!");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const csvText = event.target.result.trim();

        const rows = csvText.split(/\r?\n/);

        if (rows.length < 2) {
            alert("CSV file is empty or invalid!");
            return;
        }

        // Parse CSV rows while supporting quoted commas and quotes.
        function parseCSVRow(row) {
            const columns = [];

            let value = "";

            let insideQuotes = false;

            for (let i = 0; i < row.length; i++) {
                const character = row[i];

                if (character === '"') {
                    if (insideQuotes && row[i + 1] === '"') {
                        value += '"';
                        i++;
                    } else {
                        insideQuotes = !insideQuotes;
                    }
                } else if (character === "," && !insideQuotes) {
                    columns.push(value.trim());
                    value = "";
                } else {
                    value += character;
                }
            }

            columns.push(value.trim());

            return columns;
        }

        const importedTransactions = [];

        rows.slice(1).forEach(row => {
            if (!row.trim()) {
                return;
            }

            const columns = parseCSVRow(row);

            if (columns.length < 4) {
                return;
            }

            const [
                titleValue,
                amountValue,
                categoryValue,
                dateValue,
                expenseCategoryValue
            ] = columns;

            const amountNumber = Number(amountValue);

            if (
                !titleValue ||
                !Number.isFinite(amountNumber) ||
                amountNumber <= 0 ||
                !["Deposit", "Expense"].includes(categoryValue) ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)
            ) {
                return;
            }

            importedTransactions.push({
                title: titleValue,
                amount: amountNumber,
                category: categoryValue,

                date: dateValue,

                expenseCategory: categoryValue === "Expense"
                    ? expenseCategoryValue || "Other"
                    : ""
            });
        });

        if (importedTransactions.length === 0) {
            alert("No valid transactions found in CSV!");
            return;
        }

        transactions.push(...importedTransactions);

        localStorage.setItem(
            "transactions",
            JSON.stringify(transactions)
        );

        filterTransactions();

        updateSummary();

        updateMonthlySummary();

        updateBudgetSummary();

        updateMonthlyChart();

        updateCategoryChart();

        alert(
            `${importedTransactions.length} transactions imported successfully!`
        );

        importFile.value = "";
    };

    reader.readAsText(file);
});


// ===============================
// INITIAL DISPLAY
// ===============================

filterTransactions();

updateSummary();

updateMonthlySummary();

updateBudgetSummary();

updateMonthlyChart();

updateCategoryChart();