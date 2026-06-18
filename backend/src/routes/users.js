const express = require('express');
const { User } = require('../models');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.get('/agents', async (req, res, next) => {
  try {
    const agents = await User.findAll({
      where: { role: ['agent', 'manager'], is_active: true },
      attributes: ['id', 'name', 'email', 'role', 'avatar'],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.update({ is_active: req.body.is_active });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
