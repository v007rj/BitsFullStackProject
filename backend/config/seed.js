const db = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@school.com');
  if (existingAdmin) {
    console.log('Database already seeded.');
    return;
  }

  const hashedPassword = bcrypt.hashSync('password123', 10);

  // Seed users
  const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
  insertUser.run('Admin User', 'admin@school.com', hashedPassword, 'admin');
  insertUser.run('Staff Member', 'staff@school.com', hashedPassword, 'staff');
  insertUser.run('John Student', 'john@school.com', hashedPassword, 'student');

  // Seed equipment
  const insertEquipment = db.prepare(
    'INSERT INTO equipment (name, category, description, condition, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertEquipment.run('Basketball Set', 'Sports', 'Complete set with 5 basketballs', 'good', 5, 5);
  insertEquipment.run('Microscope', 'Lab Equipment', 'Standard optical microscope', 'new', 10, 10);
  insertEquipment.run('Digital Camera', 'Electronics', 'Canon DSLR Camera with lens kit', 'good', 3, 3);
  insertEquipment.run('Guitar', 'Musical Instruments', 'Acoustic guitar for music class', 'fair', 4, 4);
  insertEquipment.run('Projector', 'Electronics', 'HD Projector for presentations', 'good', 6, 6);
  insertEquipment.run('Chemistry Lab Kit', 'Lab Equipment', 'Complete chemistry experiment kit', 'new', 8, 8);
  insertEquipment.run('Football', 'Sports', 'Standard size 5 football', 'good', 10, 10);
  insertEquipment.run('Keyboard Piano', 'Musical Instruments', '61-key electronic keyboard', 'good', 2, 2);

  console.log('Database seeded successfully.');
}

seed();
