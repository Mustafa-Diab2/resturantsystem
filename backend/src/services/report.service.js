/**
 * Report Service – aggregated analytics queries
 */
const pool = require('../db/pool');

const reportService = {
  /** Daily sales summary */
  async dailySales({ branch_id, date }) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const conditions = [`DATE(o.created_at) = $1`, `o.status = 'delivered'`];
    const values = [targetDate];

    if (branch_id) {
      conditions.push(`o.branch_id = $${values.length + 1}`);
      values.push(branch_id);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                          AS total_orders,
         COALESCE(SUM(o.total_price), 0)  AS total_revenue,
         COALESCE(AVG(o.total_price), 0)  AS avg_order_value,
         COUNT(CASE WHEN o.type='dine_in'  THEN 1 END) AS dine_in_count,
         COUNT(CASE WHEN o.type='takeaway' THEN 1 END) AS takeaway_count,
         COUNT(CASE WHEN o.type='delivery' THEN 1 END) AS delivery_count
       FROM orders o
       ${where}`,
      values
    );

    return { date: targetDate, ...rows[0] };
  },

  /** Weekly revenue chart (last 7 days) */
  async weeklyRevenue({ branch_id }) {
    const values = [];
    const branchFilter = branch_id
      ? `AND o.branch_id = $${values.push(branch_id)}`
      : '';

    const { rows } = await pool.query(
      `SELECT
         DATE(o.created_at) AS date,
         COALESCE(SUM(o.total_price), 0) AS revenue,
         COUNT(*) AS orders
       FROM orders o
       WHERE o.status = 'delivered'
         AND o.created_at >= NOW() - INTERVAL '7 days'
         ${branchFilter}
       GROUP BY DATE(o.created_at)
       ORDER BY date ASC`,
      values
    );
    return rows;
  },

  /** Top selling products */
  async topProducts({ branch_id, limit = 10, start_date, end_date }) {
    const conditions = [`o.status = 'delivered'`];
    const values = [];

    if (branch_id) {
      conditions.push(`o.branch_id = $${values.push(branch_id)}`);
    }
    if (start_date) {
      conditions.push(`o.created_at >= $${values.push(start_date)}`);
    }
    if (end_date) {
      conditions.push(`o.created_at <= $${values.push(end_date)}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    values.push(limit);

    const { rows } = await pool.query(
      `SELECT
         p.id, p.name,
         SUM(oi.quantity)                AS total_qty,
         SUM(oi.quantity * oi.unit_price) AS total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       ${where}
       GROUP BY p.id, p.name
       ORDER BY total_qty DESC
       LIMIT $${values.length}`,
      values
    );
    return rows;
  },

  /** Hourly sales distribution */
  async hourlySales({ branch_id, date }) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const values = [targetDate];
    const branchFilter = branch_id
      ? `AND o.branch_id = $${values.push(branch_id)}`
      : '';

    const { rows } = await pool.query(
      `SELECT
         EXTRACT(HOUR FROM o.created_at) AS hour,
         COUNT(*) AS orders,
         COALESCE(SUM(o.total_price), 0) AS revenue
       FROM orders o
       WHERE DATE(o.created_at) = $1
         AND o.status = 'delivered'
         ${branchFilter}
       GROUP BY hour
       ORDER BY hour ASC`,
      values
    );
    return rows;
  },
};

module.exports = reportService;
