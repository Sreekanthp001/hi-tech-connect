const prisma = require('../config/prisma');

/**
 * Create a new expense
 * POST /api/admin/expenses
 */
exports.createExpense = async (req, res) => {
    try {
        const { title, amount, category, notes, date } = req.body;

        if (!title || !amount || !category) {
            return res.status(400).json({ error: "Title, amount, and category are required" });
        }

        const expense = await prisma.expense.create({
            data: {
                title,
                amount: parseFloat(amount),
                category,
                notes,
                date: date ? new Date(date) : new Date(),
                createdBy: req.user.name || "ADMIN"
            }
        });

        res.status(201).json(expense);
    } catch (error) {
        console.error("Create expense error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get all expenses
 * GET /api/admin/expenses
 */
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { date: 'desc' }
        });
        res.status(200).json(expenses);
    } catch (error) {
        console.error("Get expenses error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Delete an expense
 * DELETE /api/admin/expenses/:id
 */
exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.expense.delete({ where: { id } });
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Delete expense error:", error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Expense not found" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
