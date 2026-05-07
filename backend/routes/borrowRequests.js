const express = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/borrow-requests - Get borrow requests
router.get('/', authenticate, (req, res) => {
  let query;
  let params = [];

  if (req.user.role === 'student') {
    // Students see only their own requests
    query = `
      SELECT br.*, e.name as equipment_name, e.category as equipment_category,
             u.name as user_name, u.email as user_email
      FROM borrow_requests br
      JOIN equipment e ON br.equipment_id = e.id
      JOIN users u ON br.user_id = u.id
      WHERE br.user_id = ?
      ORDER BY br.request_date DESC
    `;
    params = [req.user.id];
  } else {
    // Staff and admin see all requests
    query = `
      SELECT br.*, e.name as equipment_name, e.category as equipment_category,
             u.name as user_name, u.email as user_email
      FROM borrow_requests br
      JOIN equipment e ON br.equipment_id = e.id
      JOIN users u ON br.user_id = u.id
      ORDER BY br.request_date DESC
    `;
  }

  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

// POST /api/borrow-requests - Create a borrow request (students)
router.post('/', authenticate, (req, res) => {
  const { equipment_id, quantity, due_date, notes } = req.body;

  if (!equipment_id) {
    return res.status(400).json({ error: 'Equipment ID is required.' });
  }

  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipment_id);
  if (!equipment) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  const qty = quantity || 1;

  if (equipment.available_quantity < qty) {
    return res.status(400).json({ error: 'Insufficient equipment available.' });
  }

  // Check for overlapping active requests by same user for same equipment
  const existingRequest = db.prepare(
    "SELECT id FROM borrow_requests WHERE user_id = ? AND equipment_id = ? AND status IN ('pending', 'approved')"
  ).get(req.user.id, equipment_id);

  if (existingRequest) {
    return res.status(400).json({ error: 'You already have an active request for this equipment.' });
  }

  const result = db.prepare(
    'INSERT INTO borrow_requests (user_id, equipment_id, quantity, due_date, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, equipment_id, qty, due_date || null, notes || null);

  const request = db.prepare(`
    SELECT br.*, e.name as equipment_name, e.category as equipment_category
    FROM borrow_requests br
    JOIN equipment e ON br.equipment_id = e.id
    WHERE br.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ message: 'Borrow request created.', request });
});

// PUT /api/borrow-requests/:id/approve - Approve request (staff/admin)
router.put('/:id/approve', authenticate, authorize('staff', 'admin'), (req, res) => {
  const request = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending requests can be approved.' });
  }

  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(request.equipment_id);
  if (equipment.available_quantity < request.quantity) {
    return res.status(400).json({ error: 'Insufficient equipment available.' });
  }

  // Approve the request and reduce available quantity
  const updateRequest = db.prepare('UPDATE borrow_requests SET status = ?, reviewed_by = ? WHERE id = ?');
  const updateEquipment = db.prepare('UPDATE equipment SET available_quantity = available_quantity - ? WHERE id = ?');

  const transaction = db.transaction(() => {
    updateRequest.run('approved', req.user.id, req.params.id);
    updateEquipment.run(request.quantity, request.equipment_id);
  });
  transaction();

  const updated = db.prepare(`
    SELECT br.*, e.name as equipment_name, u.name as user_name
    FROM borrow_requests br
    JOIN equipment e ON br.equipment_id = e.id
    JOIN users u ON br.user_id = u.id
    WHERE br.id = ?
  `).get(req.params.id);

  res.json({ message: 'Request approved.', request: updated });
});

// PUT /api/borrow-requests/:id/reject - Reject request (staff/admin)
router.put('/:id/reject', authenticate, authorize('staff', 'admin'), (req, res) => {
  const request = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending requests can be rejected.' });
  }

  db.prepare('UPDATE borrow_requests SET status = ?, reviewed_by = ? WHERE id = ?')
    .run('rejected', req.user.id, req.params.id);

  res.json({ message: 'Request rejected.' });
});

// PUT /api/borrow-requests/:id/return - Mark as returned (staff/admin)
router.put('/:id/return', authenticate, authorize('staff', 'admin'), (req, res) => {
  const request = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (request.status !== 'approved') {
    return res.status(400).json({ error: 'Only approved (issued) requests can be returned.' });
  }

  const updateRequest = db.prepare('UPDATE borrow_requests SET status = ?, return_date = CURRENT_TIMESTAMP WHERE id = ?');
  const updateEquipment = db.prepare('UPDATE equipment SET available_quantity = available_quantity + ? WHERE id = ?');

  const transaction = db.transaction(() => {
    updateRequest.run('returned', req.params.id);
    updateEquipment.run(request.quantity, request.equipment_id);
  });
  transaction();

  res.json({ message: 'Equipment marked as returned.' });
});

// GET /api/borrow-requests/stats - Dashboard stats (staff/admin)
router.get('/stats', authenticate, authorize('staff', 'admin'), (req, res) => {
  const totalEquipment = db.prepare('SELECT COUNT(*) as count FROM equipment').get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'pending'").get().count;
  const approvedRequests = db.prepare("SELECT COUNT(*) as count FROM borrow_requests WHERE status = 'approved'").get().count;
  const totalRequests = db.prepare('SELECT COUNT(*) as count FROM borrow_requests').get().count;

  res.json({
    stats: {
      totalEquipment,
      totalUsers,
      pendingRequests,
      approvedRequests,
      totalRequests
    }
  });
});

module.exports = router;
