const express = require('express');
const {
  getTickets, getTicket, createTicket, updateTicket,
  addMessage, generateAIResponse, deleteTicket,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/:id')
  .get(getTicket)
  .put(updateTicket)
  .delete(authorize('admin', 'manager'), deleteTicket);

router.post('/:id/messages', addMessage);
router.get('/:id/ai-response', generateAIResponse);

module.exports = router;
