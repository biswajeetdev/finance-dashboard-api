const db = require('../config/database');

exports.getSummary = async (req, res, next) => {
  try {
    const base = () => db('financial_records').where({ is_deleted: false });

    const [totals] = await base().select(
      db.raw("SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income"),
      db.raw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses"),
      db.raw("COUNT(*) AS total_records")
    );

    const categoryBreakdown = await base()
      .join('categories', 'financial_records.category_id', 'categories.id')
      .groupBy('categories.name', 'financial_records.type')
      .select(
        'categories.name as category',
        'financial_records.type',
        db.raw('SUM(amount) as total'),
        db.raw('COUNT(*) as count')
      )
      .orderBy('total', 'desc');

    const monthlyTrends = await base()
      .select(
        db.raw("TO_CHAR(date, 'YYYY-MM') AS month"),
        'type',
        db.raw('SUM(amount) AS total')
      )
      .groupByRaw("TO_CHAR(date, 'YYYY-MM'), type")
      .orderByRaw("TO_CHAR(date, 'YYYY-MM')");

    const recentActivity = await base()
      .leftJoin('categories', 'financial_records.category_id', 'categories.id')
      .leftJoin('users', 'financial_records.created_by', 'users.id')
      .select(
        'financial_records.id',
        'financial_records.amount',
        'financial_records.type',
        'financial_records.date',
        'financial_records.notes',
        'categories.name as category',
        'users.name as created_by'
      )
      .orderBy('financial_records.created_at', 'desc')
      .limit(10);

    res.json({
      summary: {
        total_income:   Number(totals.total_income)   || 0,
        total_expenses: Number(totals.total_expenses) || 0,
        net_balance:    (Number(totals.total_income) || 0) - (Number(totals.total_expenses) || 0),
        total_records:  Number(totals.total_records)
      },
      category_breakdown: categoryBreakdown,
      monthly_trends:     monthlyTrends,
      recent_activity:    recentActivity
    });
  } catch (err) { next(err); }
};