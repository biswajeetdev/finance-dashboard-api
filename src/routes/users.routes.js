const router   = require('express').Router();
const auth     = require('../middleware/auth');
const rbac     = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { updateUserSchema } = require('../validators/user.validators');
const ctrl     = require('../controllers/users.controller');

router.use(auth, rbac('read:users'));

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.put('/:id',    rbac('write:users'),  validate(updateUserSchema), ctrl.update);
router.delete('/:id', rbac('delete:users'), ctrl.deactivate);

module.exports = router;