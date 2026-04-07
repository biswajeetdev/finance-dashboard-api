const db = require('../config/database');

exports.getAll = async (req, res, next) => {
  try {
    const categories = await db('categories').select('id', 'name').orderBy('name');
    res.json(categories);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    const existing = await db('categories').whereILike('name', name.trim()).first();
    if (existing) return res.status(409).json({ error: 'Category already exists.' });

    const [category] = await db('categories').insert({ name: name.trim() }).returning(['id', 'name']);
    res.status(201).json({ message: 'Category created.', category });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await db('categories').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ error: 'Category not found.' });
    res.json({ message: 'Category deleted.' });
  } catch (err) { next(err); }
};
