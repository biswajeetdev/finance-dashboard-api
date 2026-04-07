const router = require('express').Router();
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');
const ctrl   = require('../controllers/dashboard.controller');

router.get('/summary', auth, rbac('read:dashboard'), ctrl.getSummary);

module.exports = router;