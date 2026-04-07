const router   = require('express').Router();
const auth     = require('../middleware/auth');
const rbac     = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { recordSchema, recordUpdateSchema } = require('../validators/record.validators');
const ctrl     = require('../controllers/records.controller');

router.get('/',       auth, rbac('read:records'),   ctrl.getAll);
router.get('/:id',    auth, rbac('read:records'),   ctrl.getOne);
router.post('/',      auth, rbac('write:records'),  validate(recordSchema), ctrl.create);
router.put('/:id',    auth, rbac('write:records'),  validate(recordUpdateSchema), ctrl.update);
router.delete('/:id', auth, rbac('delete:records'), ctrl.remove);

module.exports = router;