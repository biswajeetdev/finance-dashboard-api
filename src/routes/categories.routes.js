const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/categories.controller');

// All authenticated users can list categories
router.get('/',       auth, ctrl.getAll);
// Only admins can create/delete categories (admin is the only role with write+delete on records)
router.post('/',      auth, rbac('write:records', 'delete:records'), ctrl.create);
router.delete('/:id', auth, rbac('write:records', 'delete:records'), ctrl.remove);

module.exports = router;
