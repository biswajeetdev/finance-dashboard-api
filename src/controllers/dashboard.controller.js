const db = require('../config/database');

// Build the next N month labels from today (e.g. ["2026-07", "2026-08", "2026-09"])
function nextMonths(n) {
  const months = [];
  const d = new Date();
  for (let i = 1; i <= n; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

exports.getForecast = async (req, res, next) => {
  try {
    const horizon = Math.min(12, Math.max(1, parseInt(req.query.months, 10) || 3));
    // lookback window mirrors the forecast horizon (min 3 months for stability)
    const lookback = Math.max(3, horizon);

    const cutoff = db.raw(
      `NOW() - INTERVAL '${lookback} months'`
    );

    const history = await db('financial_records')
      .where({ is_deleted: false })
      .where('date', '>=', cutoff)
      .select(
        db.raw("TO_CHAR(date, 'YYYY-MM') AS month"),
        'type',
        db.raw('SUM(amount) AS total')
      )
      .groupByRaw("TO_CHAR(date, 'YYYY-MM'), type")
      .orderByRaw("TO_CHAR(date, 'YYYY-MM')");

    // Compute monthly averages per type
    const byType = { income: [], expense: [] };
    for (const row of history) {
      if (byType[row.type]) byType[row.type].push(Number(row.total));
    }
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const avgIncome  = avg(byType.income);
    const avgExpense = avg(byType.expense);

    // Category-level averages for expense breakdown
    const catHistory = await db('financial_records as r')
      .join('categories as c', 'r.category_id', 'c.id')
      .where({ 'r.is_deleted': false, 'r.type': 'expense' })
      .where('r.date', '>=', cutoff)
      .select(
        'c.name as category',
        db.raw('SUM(r.amount) AS total'),
        db.raw(`COUNT(DISTINCT TO_CHAR(r.date, 'YYYY-MM')) AS months_active`)
      )
      .groupBy('c.name')
      .orderBy('total', 'desc');

    const categoryForecast = catHistory.map((row) => ({
      category:         row.category,
      projected_monthly: Number(
        (Number(row.total) / Math.max(1, Number(row.months_active))).toFixed(2)
      ),
    }));

    const forecast = nextMonths(horizon).map((month) => ({
      month,
      projected_income:   Number(avgIncome.toFixed(2)),
      projected_expenses: Number(avgExpense.toFixed(2)),
      projected_net:      Number((avgIncome - avgExpense).toFixed(2)),
    }));

    res.json({
      lookback_months:   lookback,
      forecast_horizon:  horizon,
      avg_monthly_income:   Number(avgIncome.toFixed(2)),
      avg_monthly_expenses: Number(avgExpense.toFixed(2)),
      forecast,
      category_forecast: categoryForecast,
    });
  } catch (err) { next(err); }
};

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