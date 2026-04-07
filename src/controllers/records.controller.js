const db = require('../config/database');

const parsePage  = (v) => Math.max(1, parseInt(v, 10) || 1);
const parseLimit = (v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20));

exports.getAll = async (req, res, next) => {
  try {
    const {
      type, category_id, start_date, end_date, search,
      sort = 'date', order = 'desc'
    } = req.query;

    const page  = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);

    const allowedSorts  = ['date', 'amount', 'created_at'];
    const allowedOrders = ['asc', 'desc'];
    const safeSort  = allowedSorts.includes(sort)   ? sort  : 'date';
    const safeOrder = allowedOrders.includes(order) ? order : 'desc';

    let query = db('financial_records as r')
      .leftJoin('categories as c', 'r.category_id', 'c.id')
      .leftJoin('users as u', 'r.created_by', 'u.id')
      .where('r.is_deleted', false)
      .select(
        'r.id', 'r.amount', 'r.type', 'r.date', 'r.notes',
        'c.name as category',
        'u.name as created_by'
      );

    if (type)        query = query.where('r.type', type);
    if (category_id) query = query.where('r.category_id', parseInt(category_id, 10));
    if (start_date)  query = query.where('r.date', '>=', start_date);
    if (end_date)    query = query.where('r.date', '<=', end_date);
    if (search)      query = query.whereILike('r.notes', `%${search}%`);

    const [{ count }] = await query.clone().clearSelect().count('r.id as count');
    const total = Number(count);

    const offset  = (page - 1) * limit;
    const records = await query
      .orderBy(`r.${safeSort}`, safeOrder)
      .limit(limit)
      .offset(offset);

    res.json({
      data: records,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const record = await db('financial_records as r')
      .leftJoin('categories as c', 'r.category_id', 'c.id')
      .where({ 'r.id': req.params.id, 'r.is_deleted': false })
      .select('r.*', 'c.name as category')
      .first();
    if (!record) return res.status(404).json({ error: 'Record not found.' });
    res.json(record);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { amount, type, category_id, date, notes } = req.body;

    const category = await db('categories').where({ id: category_id }).first();
    if (!category) return res.status(400).json({ error: 'Category not found.' });

    const [record] = await db('financial_records')
      .insert({ amount, type, category_id, date, notes, created_by: req.user.id })
      .returning('*');

    res.status(201).json({ message: 'Record created.', record });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const [record] = await db('financial_records')
      .where({ id: req.params.id, is_deleted: false })
      .update({ ...req.body, updated_at: new Date() })
      .returning('*');
    if (!record) return res.status(404).json({ error: 'Record not found.' });
    res.json({ message: 'Record updated.', record });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const updated = await db('financial_records')
      .where({ id: req.params.id, is_deleted: false })
      .update({ is_deleted: true, updated_at: new Date() });
    if (!updated) return res.status(404).json({ error: 'Record not found.' });
    res.json({ message: 'Record deleted.' });
  } catch (err) { next(err); }
};
