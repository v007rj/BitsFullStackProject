const express = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/equipment - List all equipment (any authenticated user)
router.get('/', authenticate, (req, res) => {
  const { category, search, available } = req.query;

  let query = 'SELECT * FROM equipment WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (available === 'true') {
    query += ' AND available_quantity > 0';
  }

  query += ' ORDER BY created_at DESC';

  const equipment = db.prepare(query).all(...params);
  res.json({ equipment });
});

// GET /api/equipment/categories - Get unique categories
router.get('/categories', authenticate, (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM equipment ORDER BY category').all();
  res.json({ categories: categories.map(c => c.category) });
});

// GET /api/equipment/:id - Get single equipment
router.get('/:id', authenticate, (req, res) => {
  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!equipment) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }
  res.json({ equipment });
});

// POST /api/equipment - Add new equipment (admin only)
router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, category, description, condition, total_quantity } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required.' });
  }

  const qty = total_quantity || 1;
  const cond = condition || 'good';

  const result = db.prepare(
    'INSERT INTO equipment (name, category, description, condition, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, category, description || '', cond, qty, qty);

  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Equipment added successfully.', equipment });
});

// PUT /api/equipment/:id - Update equipment (admin only)
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  const { name, category, description, condition, total_quantity } = req.body;

  const newName = name || existing.name;
  const newCategory = category || existing.category;
  const newDescription = description !== undefined ? description : existing.description;
  const newCondition = condition || existing.condition;
  const newTotalQty = total_quantity !== undefined ? total_quantity : existing.total_quantity;

  // Adjust available quantity proportionally
  const qtyDiff = newTotalQty - existing.total_quantity;
  const newAvailableQty = Math.max(0, existing.available_quantity + qtyDiff);

  db.prepare(
    'UPDATE equipment SET name = ?, category = ?, description = ?, condition = ?, total_quantity = ?, available_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(newName, newCategory, newDescription, newCondition, newTotalQty, newAvailableQty, req.params.id);

  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json({ message: 'Equipment updated successfully.', equipment });
});

// DELETE /api/equipment/:id - Delete equipment (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Equipment not found.' });
  }

  // Check for active borrow requests
  const activeBorrows = db.prepare(
    "SELECT COUNT(*) as count FROM borrow_requests WHERE equipment_id = ? AND status IN ('pending', 'approved')"
  ).get(req.params.id);

  if (activeBorrows.count > 0) {
    return res.status(400).json({ error: 'Cannot delete equipment with active borrow requests.' });
  }

  db.prepare('DELETE FROM borrow_requests WHERE equipment_id = ?').run(req.params.id);
  db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id);
  res.json({ message: 'Equipment deleted successfully.' });
});

module.exports = router;
