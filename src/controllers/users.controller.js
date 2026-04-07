const db = require('../config/database');

const parsePage  = (v) => Math.max(1, parseInt(v, 10) || 1);
const parseLimit = (v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20));

const VALID_ROLES   = ['viewer', 'analyst', 'admin'];
const VALID_STATUSES = ['active', 'inactive'];

exports.getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const role   = VALID_ROLES.includes(req.query.role)     ? req.query.role   : undefined;
    const status = VALID_STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const page   = parsePage(req.query.page);
    const limit  = parseLimit(req.query.limit);

    let query = db('users').select('id', 'name', 'email', 'role', 'status', 'created_at');

    if (search) {
      query = query.where(function () {
        this.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`);
      });
    }
    if (role)   query = query.where({ role });
    if (status) query = query.where({ status });

    const [{ count }] = await query.clone().clearSelect().count('id as count');
    const total = Number(count);

    const offset = (page - 1) * limit;
    const users = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      data: users,
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
    const user = await db('users')
      .where({ id: req.params.id })
      .select('id', 'name', 'email', 'role', 'status', 'created_at')
      .first();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const [user] = await db('users')
      .where({ id: req.params.id })
      .update({ ...req.body, updated_at: new Date() })
      .returning(['id', 'name', 'email', 'role', 'status']);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User updated.', user });
  } catch (err) { next(err); }
};

exports.deactivate = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(403).json({ error: 'You cannot deactivate your own account.' });
    }
    const updated = await db('users')
      .where({ id: req.params.id })
      .update({ status: 'inactive', updated_at: new Date() });
    if (!updated) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deactivated.' });
  } catch (err) { next(err); }
};