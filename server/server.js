import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './config/database.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;



// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint with detailed status
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    
    // Test basic queries
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [tickets] = await connection.execute('SELECT COUNT(*) as count FROM tickets');
    const [equipment] = await connection.execute('SELECT COUNT(*) as count FROM equipment');
    
    connection.release();
    
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: 'Connected',
      tables: {
        users: users[0].count,
        tickets: tickets[0].count,
        equipment: equipment[0].count
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Server is running but database is disconnected',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple notification helper
async function createNotificationsForUsers(userIds, type, title, message) {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    for (const uid of userIds) {
      await pool.execute(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [uid, type, title, message]
      );
    }
  } catch (err) {
    console.error('Notification insert failed:', err);
  }
}

// Database schema check endpoint
app.get('/api/debug/schema', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Check users table structure
    const [usersColumns] = await connection.execute('DESCRIBE users');
    
    // Check tickets table structure
    const [ticketsColumns] = await connection.execute('DESCRIBE tickets');
    
    // Check equipment table structure
    const [equipmentColumns] = await connection.execute('DESCRIBE equipment');
    
    // Check if avatar_url column exists
    const avatarColumn = usersColumns.find(col => col.Field === 'avatar_url');
    
    connection.release();
    
    res.json({
      usersTableColumns: usersColumns.map(col => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key,
        default: col.Default
      })),
      ticketsTableColumns: ticketsColumns.map(col => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key,
        default: col.Default
      })),
      equipmentTableColumns: equipmentColumns.map(col => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key,
        default: col.Default
      })),
      avatarUrlColumnExists: !!avatarColumn,
      avatarColumnDetails: avatarColumn || null
    });
  } catch (error) {
    console.error('Schema check error:', error);
    res.status(500).json({ error: 'Failed to check schema', details: error.message });
  }
});

// Fix database schema endpoint
app.post('/api/debug/fix-schema', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Check if avatar_url column exists
    const [columns] = await connection.execute('DESCRIBE users');
    const avatarColumn = columns.find(col => col.Field === 'avatar_url');
    
    if (!avatarColumn) {
      console.log('Adding missing avatar_url column...');
      await connection.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT AFTER department');
      console.log('avatar_url column added successfully');
    } else if (avatarColumn.Type.includes('varchar(500)')) {
      console.log('Converting avatar_url from VARCHAR(500) to TEXT...');
      await connection.execute('ALTER TABLE users MODIFY COLUMN avatar_url TEXT');
      console.log('avatar_url column converted to TEXT successfully');
    } else {
      console.log('avatar_url column already exists with correct type');
    }
    
    // Check and fix equipment table structure
    const [equipmentColumns] = await connection.execute('DESCRIBE equipment');
    const assignedToColumn = equipmentColumns.find(col => col.Field === 'assigned_to_id');
    
    if (!assignedToColumn) {
      console.log('Adding missing assigned_to_id column to equipment...');
      await connection.execute('ALTER TABLE equipment ADD COLUMN assigned_to_id INT AFTER status');
      console.log('assigned_to_id column added successfully');
    }
    
    connection.release();
    
    res.json({ 
      success: true, 
      message: 'Database schema fixed',
      avatarUrlColumnAdded: !avatarColumn,
      avatarUrlColumnConverted: avatarColumn && avatarColumn.Type.includes('varchar(500)'),
      equipmentAssignedToColumnAdded: !assignedToColumn
    });
  } catch (error) {
    console.error('Schema fix error:', error);
    res.status(500).json({ error: 'Failed to fix schema', details: error.message });
  }
});

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    
    res.json({
      server: 'Running',
      database: 'Connected',
      apis: {
        auth: 'Active',
        users: 'Active',
        equipment: 'Active',
        tickets: 'Active',
        comments: 'Active'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      server: 'Running',
      database: 'Disconnected',
      apis: {
        auth: 'Limited',
        users: 'Limited',
        equipment: 'Limited',
        tickets: 'Limited',
        comments: 'Limited'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Test ticket creation endpoint
app.post('/api/debug/test-ticket', async (req, res) => {
  try {
    console.log('=== TESTING TICKET CREATION ===');
    console.log('Request body:', req.body);
    
    const { title, description, type, priority, status, created_by } = req.body;
    
    // Test with minimal data
    const testData = {
      title: title || 'Test Ticket',
      description: description || 'Test Description',
      type: type || 'Incident',
      priority: priority || 'Normale',
      status: status || 'Ouvert',
      created_by: created_by || 1
    };
    
    console.log('Test data:', testData);
    
    // Test the INSERT query
    const [result] = await pool.execute(
      'INSERT INTO tickets (title, description, type, priority, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [testData.title, testData.description, testData.type, testData.priority, testData.status, testData.created_by]
    );
    
    console.log('Test INSERT successful, ID:', result.insertId);
    
    // Clean up - delete the test ticket
    await pool.execute('DELETE FROM tickets WHERE id = ?', [result.insertId]);
    console.log('Test ticket cleaned up');
    
    res.json({ 
      success: true, 
      message: 'Ticket creation test successful',
      testData,
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Test ticket creation error:', error);
    console.error('Error details:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Error Code:', error.errno);
    
    res.status(500).json({ 
      error: 'Ticket creation test failed', 
      details: error.message,
      sqlState: error.sqlState,
      errno: error.errno
    });
  }
});

// Global error handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email, 'Password provided:', password ? 'Yes' : 'No');
    
    // Test database connection first
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.execute(
        'SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE email = ?',
        [email]
      );

      console.log('Users found:', users.length);
      if (users.length === 0) {
        console.log('No user found with email:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];
      console.log('User found:', user.name, 'Role:', user.role);
      const validPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', validPassword);

      if (!validPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Normalize JWT expiresIn
      let expiresIn = process.env.JWT_EXPIRES_IN;
      if (expiresIn === '1500D') expiresIn = '1500d';
      if (!expiresIn) expiresIn = '7d';

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        (process.env.JWT_SECRET || 'dev_secret_change_me'),
        { expiresIn }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department_id: user.department_id,
          department_name: user.department_name,
          avatar_url: user.avatar_url
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      res.status(503).json({ error: 'Database connection failed' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', department_id } = req.body;
    console.log('Registration attempt:', { name, email, role, department_id, passwordProvided: password ? 'Yes' : 'No' });
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Role validation
    const validRoles = ['admin', 'it_personnel', 'employee'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Sanitize department_id to allow null when not provided
    const sanitizedDepartmentId = (department_id === undefined || department_id === '') ? null : department_id;

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, sanitizedDepartmentId]
    );

    const [users] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.avatar_url FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [result.insertId]
    );

    const user = users[0];
    // Normalize JWT expiresIn
    let expiresIn = process.env.JWT_EXPIRES_IN;
    if (expiresIn === '1500D') expiresIn = '1500d';
    if (!expiresIn) expiresIn = '7d';

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      (process.env.JWT_SECRET || 'dev_secret_change_me'),
      { expiresIn }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
  }
});

// Users routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.created_at FROM users u LEFT JOIN departments d ON u.department_id = d.id ORDER BY u.created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    console.log('Creating user with data:', req.body);
    const { name, email, password, role, department_id } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      console.error('Missing required fields:', { name, email, password, role });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('Processed user data:', { name, email, role, department_id });
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, department_id]
    );

    const [user] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.created_at FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [result.insertId]
    );

    // Notify admins of new user
    try {
      const [admins] = await pool.execute('SELECT id FROM users WHERE role = ?',[ 'admin' ]);
      await createNotificationsForUsers(admins.map(a => a.id), 'info', 'Nouvel utilisateur', `Utilisateur "${name}" a été créé.`);
    } catch (notifyErr) {
      console.error('Failed to notify admins about new user:', notifyErr);
    }
    res.status(201).json(user[0]);
  } catch (error) {
    console.error('Create user error:', error);
    console.error('Error details:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Error Code:', error.errno);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [users] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.created_at FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile management routes - MUST come before /api/users/:id to avoid route conflicts
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, department_id } = req.body;
    const userId = req.user.id;
    
    // Input validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Handle undefined department_id - convert to null for database
    const sanitizedDepartmentId = department_id === undefined ? null : department_id;
    
    // Check if email is being changed and if it already exists
    if (email !== req.user.email) {
      const [duplicateUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (duplicateUsers.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Update the user profile
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, department_id = ? WHERE id = ?',
      [name, email, sanitizedDepartmentId, userId]
    );
    
    // Get updated user
    const [updatedUsers] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.created_at FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [userId]
    );
    
    // Update the user object in the token
    const updatedUser = { ...updatedUsers[0] };
    const newToken = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    try {
      await createNotificationsForUsers([userId], 'success', 'Profil mis à jour', 'Votre profil a été mis à jour.');
    } catch (notifyErr) {
      console.error('Failed to notify profile update:', notifyErr);
    }
    res.json({ user: updatedUser, token: newToken });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    // Get current user with password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Avatar upload endpoint
app.put('/api/users/avatar', authenticateToken, async (req, res) => {
  try {
    console.log('Avatar update request received for user:', req.user.id);
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    
    const { avatarUrl } = req.body;
    console.log('Avatar URL extracted:', avatarUrl ? 'Yes' : 'No');
    console.log('Avatar URL length:', avatarUrl ? avatarUrl.length : 0);
    
    if (!avatarUrl) {
      return res.status(400).json({ error: 'avatarUrl is required' });
    }
    
    // Check if avatarUrl is reasonable (max 10MB equivalent in base64)
    if (avatarUrl.length > 10 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'Avatar URL is too long. Maximum size is 10MB.',
        currentLength: avatarUrl.length,
        maxSize: '10MB'
      });
    }
    
    const userId = req.user.id;
    
    // Update avatar URL
    console.log('Executing UPDATE query for user:', userId);
    console.log('Avatar URL length:', avatarUrl.length);
    
    const updateResult = await pool.execute(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatarUrl, userId]
    );
    
    console.log('Update result:', updateResult);
    
    // Get updated user
    console.log('Executing SELECT query for user:', userId);
    const [updatedUsers] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.avatar_url, u.created_at FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [userId]
    );
    console.log('Updated users found:', updatedUsers.length);
    console.log('Updated user data:', updatedUsers[0]);
    
    // Update the user object in the token
    const updatedUser = { ...updatedUsers[0] };
    console.log('Creating new JWT token for user:', updatedUser.id);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
    
    // Convert JWT_EXPIRES_IN to a valid format if needed
    let expiresIn = process.env.JWT_EXPIRES_IN;
    if (expiresIn === '1500D') {
      expiresIn = '1500d'; // Ensure lowercase 'd' for days
    }
    
    try {
      const newToken = jwt.sign(
        { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
        process.env.JWT_SECRET,
        { expiresIn: expiresIn }
      );
      
      res.json({ user: updatedUser, token: newToken });
    } catch (jwtError) {
      console.error('JWT token creation error:', jwtError);
      throw new Error(`Failed to create JWT token: ${jwtError.message}`);
    }
  } catch (error) {
    console.error('Update avatar error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Authorization check - only admins can update users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update users' });
    }
    
    const userId = req.params.id;
    const { name, email, role, department_id } = req.body;
    
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id, name, email, role, department_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const existingUser = existingUsers[0];
    
    // For partial updates, only validate fields that are being changed
    const updatedName = name !== undefined ? name : existingUser.name;
    const updatedEmail = email !== undefined ? email : existingUser.email;
    const updatedRole = role !== undefined ? role : existingUser.role;
    const updatedDepartmentId = department_id !== undefined ? department_id : existingUser.department_id;
    
    // Input validation for fields that are being updated
    if (name !== undefined && !name) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    
    if (email !== undefined && !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Role validation
    const validRoles = ['admin', 'it_personnel', 'employee'];
    if (role !== undefined && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if email is being changed and if it already exists
    if (email !== undefined && email !== existingUser.email) {
      const [duplicateUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (duplicateUsers.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Update the user
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, role = ?, department_id = ? WHERE id = ?',
      [updatedName, updatedEmail, updatedRole, updatedDepartmentId, userId]
    );
    
    // Get updated user
    const [updatedUsers] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, u.created_at FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [userId]
    );
    
    try {
      await createNotificationsForUsers([Number(userId)], 'info', 'Compte mis à jour', 'Les informations de votre compte ont été mises à jour par un administrateur.');
    } catch (notifyErr) {
      console.error('Failed to notify user update:', notifyErr);
    }
    res.json(updatedUsers[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user is trying to delete themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }
    
    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete the user
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    try {
      const [admins] = await pool.execute('SELECT id FROM users WHERE role = ?',[ 'admin' ]);
      await createNotificationsForUsers(admins.map(a => a.id), 'warning', 'Utilisateur supprimé', `Le compte "${users[0].name}" a été supprimé.`);
    } catch (notifyErr) {
      console.error('Failed to notify user deletion:', notifyErr);
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Department management routes
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const [departments] = await pool.execute(
      'SELECT * FROM departments ORDER BY name ASC'
    );
    const normalized = departments.map(d => ({
      ...d,
      permissions: d.permissions
        ? (typeof d.permissions === 'string' ? JSON.parse(d.permissions) : d.permissions)
        : { tickets: false, equipment: false, users: false, reports: false }
    }));
    res.json(normalized);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single department
app.get('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.params.id;
    const [rows] = await pool.execute(
      'SELECT * FROM departments WHERE id = ? LIMIT 1',
      [departmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    const d = rows[0];
    const normalized = {
      ...d,
      permissions: d.permissions
        ? (typeof d.permissions === 'string' ? JSON.parse(d.permissions) : d.permissions)
        : { tickets: false, equipment: false, users: false, reports: false }
    };
    res.json(normalized);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/departments', authenticateToken, async (req, res) => {
  try {
    // Only admins can create departments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create departments' });
    }
    
    const { name, description, permissions, manager_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    // Check if department already exists
    const [existingDepts] = await pool.execute(
      'SELECT id FROM departments WHERE name = ?',
      [name]
    );
    
    if (existingDepts.length > 0) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO departments (name, description, manager_id, permissions) VALUES (?, ?, ?, ?)',
      [name, description || null, manager_id || null, permissions ? JSON.stringify(permissions) : null]
    );
    
    const [newDepartment] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [result.insertId]
    );

    const d = newDepartment[0];
    const normalized = {
      ...d,
      permissions: d.permissions
        ? (typeof d.permissions === 'string' ? JSON.parse(d.permissions) : d.permissions)
        : { tickets: true, equipment: false, users: false, reports: false }
    };
    try {
      const [admins] = await pool.execute('SELECT id FROM users WHERE role = ?',[ 'admin' ]);
      await createNotificationsForUsers(admins.map(a => a.id), 'success', 'Nouveau département', `Le département "${name}" a été créé.`);
    } catch (notifyErr) {
      console.error('Failed to notify department creation:', notifyErr);
    }
    res.status(201).json(normalized);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    // Only admins can update departments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update departments' });
    }
    
    const departmentId = req.params.id;
    const { name, description, permissions, manager_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    // Check if department exists
    const [existingDepts] = await pool.execute(
      'SELECT id FROM departments WHERE id = ?',
      [departmentId]
    );
    
    if (existingDepts.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check if new name conflicts with existing departments
    const [nameConflict] = await pool.execute(
      'SELECT id FROM departments WHERE name = ? AND id != ?',
      [name, departmentId]
    );
    
    if (nameConflict.length > 0) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    
    await pool.execute(
      'UPDATE departments SET name = ?, description = ?, manager_id = ?, permissions = ? WHERE id = ?',
      [name, description || null, manager_id || null, permissions ? JSON.stringify(permissions) : null, departmentId]
    );
    
    const [updatedDepartment] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [departmentId]
    );
    const d = updatedDepartment[0];
    const normalized = {
      ...d,
      permissions: d.permissions
        ? (typeof d.permissions === 'string' ? JSON.parse(d.permissions) : d.permissions)
        : { tickets: false, equipment: false, users: false, reports: false }
    };
    try {
      const [admins] = await pool.execute('SELECT id FROM users WHERE role = ?',[ 'admin' ]);
      await createNotificationsForUsers(admins.map(a => a.id), 'info', 'Département mis à jour', `Le département "${name}" a été mis à jour.`);
    } catch (notifyErr) {
      console.error('Failed to notify department update:', notifyErr);
    }
    res.json(normalized);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/departments/:id', authenticateToken, async (req, res) => {
  try {
    // Only admins can delete departments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete departments' });
    }
    
    const departmentId = req.params.id;
    
    // Check if department exists
    const [existingDepts] = await pool.execute(
      'SELECT id FROM departments WHERE id = ?',
      [departmentId]
    );
    
    if (existingDepts.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check if department is in use by any users
    const [usersUsingDept] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE department_id = ?',
      [departmentId]
    );
    
    if (usersUsingDept[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete department that has users assigned to it' });
    }
    
    // Check if department is in use by any equipment
    const [equipmentUsingDept] = await pool.execute(
      'SELECT COUNT(*) as count FROM equipment WHERE department_id = ?',
      [departmentId]
    );
    
    if (equipmentUsingDept[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete department that has equipment assigned to it' });
    }
    
    // Delete the department
    await pool.execute('DELETE FROM departments WHERE id = ?', [departmentId]);
    
    try {
      const [admins] = await pool.execute('SELECT id FROM users WHERE role = ?',[ 'admin' ]);
      await createNotificationsForUsers(admins.map(a => a.id), 'warning', 'Département supprimé', `Le département #${departmentId} a été supprimé.`);
    } catch (notifyErr) {
      console.error('Failed to notify department deletion:', notifyErr);
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Equipment routes
app.get('/api/equipment', authenticateToken, async (req, res) => {
  try {
    const [equipment] = await pool.execute(
      'SELECT * FROM equipment ORDER BY created_at DESC'
    );
    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/equipment', authenticateToken, async (req, res) => {
  try {
    console.log('Creating equipment with data:', req.body);
    const { name, type, brand, model, serial_number, status, assigned_to, location, purchase_date, warranty_expiry, notes } = req.body;
    
    // Validate required fields
    if (!name || !type || !brand || !model || !serial_number || !location) {
      console.error('Missing required fields:', { name, type, brand, model, serial_number, location });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Normalize assignment. Accept: '', undefined, 'stock' => NULL; otherwise numeric user id
    let cleanAssignedTo = null;
    if (assigned_to !== undefined && assigned_to !== '' && assigned_to !== 'stock' && assigned_to !== null) {
      const parsed = Number(assigned_to);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ error: 'Invalid assignee ID format' });
      }
      // Verify user exists
      const [existingUsers] = await pool.execute('SELECT id FROM users WHERE id = ?', [parsed]);
      if (existingUsers.length === 0) {
        return res.status(400).json({ error: 'Assignee not found' });
      }
      cleanAssignedTo = parsed;
    }
    
    console.log('Processed equipment data:', { name, type, brand, model, serial_number, status, assigned_to: cleanAssignedTo, location, purchase_date, warranty_expiry, notes });
    
    const [result] = await pool.execute(
      'INSERT INTO equipment (name, type, brand, model, serial_number, status, assigned_to_id, location, purchase_date, warranty_expiry, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, type, brand, model, serial_number, status, cleanAssignedTo, location, purchase_date, warranty_expiry, notes]
    );

    const [equipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [result.insertId]
    );

    try {
      const [itAndAdmins] = await pool.execute("SELECT id FROM users WHERE role IN ('admin','it_personnel')");
      await createNotificationsForUsers(itAndAdmins.map(u => u.id), 'success', 'Équipement ajouté', `L'équipement "${name}" a été ajouté.`);
    } catch (notifyErr) {
      console.error('Failed to notify equipment creation:', notifyErr);
    }
    res.status(201).json(equipment[0]);
  } catch (error) {
    console.error('Create equipment error:', error);
    console.error('Error details:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Error Code:', error.errno);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/equipment/:id', authenticateToken, async (req, res) => {
  try {
    const equipmentId = req.params.id;
    
    const [equipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    if (equipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json(equipment[0]);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/equipment/:id', authenticateToken, async (req, res) => {
  try {
    const equipmentId = req.params.id;
    const { name, type, brand, model, serial_number, status, assigned_to, location, purchase_date, warranty_expiry, notes } = req.body;
    
    // Check if equipment exists
    const [existingEquipment] = await pool.execute(
      'SELECT id FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    if (existingEquipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Check if serial number is being changed and if it already exists
    if (serial_number) {
      const [duplicateEquipment] = await pool.execute(
        'SELECT id FROM equipment WHERE serial_number = ? AND id != ?',
        [serial_number, equipmentId]
      );
      
      if (duplicateEquipment.length > 0) {
        return res.status(400).json({ error: 'Serial number already exists' });
      }
    }
    
    // Normalize assignment. Accept: '', undefined, 'stock' => NULL; otherwise numeric user id
    let cleanAssignedTo = null;
    if (assigned_to !== undefined && assigned_to !== '' && assigned_to !== 'stock' && assigned_to !== null) {
      const parsed = Number(assigned_to);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ error: 'Invalid assignee ID format' });
      }
      // Verify user exists
      const [existingUsers] = await pool.execute('SELECT id FROM users WHERE id = ?', [parsed]);
      if (existingUsers.length === 0) {
        return res.status(400).json({ error: 'Assignee not found' });
      }
      cleanAssignedTo = parsed;
    }
    
    // Update the equipment
    await pool.execute(
      `UPDATE equipment SET 
        name = ?, type = ?, brand = ?, model = ?, serial_number = ?, 
        status = ?, assigned_to_id = ?, location = ?, purchase_date = ?, 
        warranty_expiry = ?, notes = ? 
       WHERE id = ?`,
      [name, type, brand, model, serial_number, status, cleanAssignedTo, location, purchase_date, warranty_expiry, notes, equipmentId]
    );
    
    // Get updated equipment
    const [updatedEquipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    try {
      const [itAndAdmins] = await pool.execute("SELECT id FROM users WHERE role IN ('admin','it_personnel')");
      await createNotificationsForUsers(itAndAdmins.map(u => u.id), 'info', 'Équipement mis à jour', `L'équipement "${name}" a été mis à jour.`);
    } catch (notifyErr) {
      console.error('Failed to notify equipment update:', notifyErr);
    }
    res.json(updatedEquipment[0]);
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/equipment/:id', authenticateToken, async (req, res) => {
  try {
    const equipmentId = req.params.id;
    
    // Check if equipment exists
    const [existingEquipment] = await pool.execute(
      'SELECT id, name FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    if (existingEquipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Check if equipment is assigned to any tickets
    const [tickets] = await pool.execute(
      'SELECT id FROM tickets WHERE equipment_id = ?',
      [equipmentId]
    );
    
    if (tickets.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete equipment that is associated with tickets. Please reassign or close related tickets first.' 
      });
    }
    
    // Delete the equipment
    await pool.execute('DELETE FROM equipment WHERE id = ?', [equipmentId]);
    
    try {
      const [itAndAdmins] = await pool.execute("SELECT id FROM users WHERE role IN ('admin','it_personnel')");
      await createNotificationsForUsers(itAndAdmins.map(u => u.id), 'warning', 'Équipement supprimé', `Un équipement (#${equipmentId}) a été supprimé.`);
    } catch (notifyErr) {
      console.error('Failed to notify equipment deletion:', notifyErr);
    }
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced equipment management
app.put('/api/equipment/:id/assign', authenticateToken, async (req, res) => {
  try {
    const equipmentId = req.params.id;
    const { userId } = req.body;
    
    // Check if equipment exists
    const [existingEquipment] = await pool.execute(
      'SELECT id, name, status FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    if (existingEquipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Check if user exists
    if (userId) {
      const [existingUsers] = await pool.execute(
        'SELECT id, name FROM users WHERE id = ?',
        [userId]
      );
      
      if (existingUsers.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    }
    
    // Update equipment assignment
    await pool.execute(
      'UPDATE equipment SET assigned_to_id = ?, status = ? WHERE id = ?',
      [userId || null, userId ? 'En utilisation' : 'Disponible', equipmentId]
    );
    
    // Get updated equipment
    const [updatedEquipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    res.json(updatedEquipment[0]);
  } catch (error) {
    console.error('Assign equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/equipment/:id/unassign', authenticateToken, async (req, res) => {
  try {
    const equipmentId = req.params.id;
    
    // Check if equipment exists
    const [existingEquipment] = await pool.execute(
      'SELECT id, name FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    if (existingEquipment.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Unassign equipment
    await pool.execute(
      'UPDATE equipment SET assigned_to_id = NULL, status = ? WHERE id = ?',
      ['Disponible', equipmentId]
    );
    
    // Get updated equipment
    const [updatedEquipment] = await pool.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [equipmentId]
    );
    
    res.json(updatedEquipment[0]);
  } catch (error) {
    console.error('Unassign equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tickets routes
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT t.*, 
             u1.name as creator_name,
             u2.name as assignee_name,
             e.name as equipment_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN equipment e ON t.equipment_id = e.id
    `;
    
    const params = [];
    
    if (req.user.role === 'employee') {
      query += ' WHERE t.created_by = ?';
      params.push(req.user.id);
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const [tickets] = await pool.execute(query, params);
    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    const [tickets] = await pool.execute(
      `SELECT t.*, 
              u1.name as creator_name,
              u2.name as assignee_name,
              e.name as equipment_name
       FROM tickets t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       LEFT JOIN equipment e ON t.equipment_id = e.id
       WHERE t.id = ?`,
      [ticketId]
    );
    
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(tickets[0]);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    console.log('=== TICKET CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    console.log('Headers:', req.headers);
    
    const { title, description, type, priority, status, created_by, assigned_to, equipment_id } = req.body;
    
    // Validate required fields
    if (!title || !description || !type || !priority || !status || !created_by) {
      console.error('Missing required fields:', { title, description, type, priority, status, created_by });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Clean up equipment_id - convert empty string to null
    const cleanEquipmentId = equipment_id === '' ? null : equipment_id;
    const cleanAssignedTo = assigned_to === '' || assigned_to === undefined ? null : assigned_to;
    
    // Security check: ensure the user can only create tickets for themselves
    if (Number(created_by) !== req.user.id) {
      console.error('Security violation: User trying to create ticket for different user');
      console.error('Token user ID:', req.user.id, 'Requested created_by:', created_by);
      return res.status(400).json({ error: 'You can only create tickets for yourself' });
    }
    
    // Validate data types
    if (isNaN(Number(created_by))) {
      console.error('Invalid created_by value:', created_by);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    if (cleanEquipmentId && isNaN(Number(cleanEquipmentId))) {
      console.error('Invalid equipment_id value:', cleanEquipmentId);
      return res.status(400).json({ error: 'Invalid equipment ID format' });
    }
    
    if (cleanAssignedTo && isNaN(Number(cleanAssignedTo))) {
      console.error('Invalid assigned_to value:', cleanAssignedTo);
      return res.status(400).json({ error: 'Invalid assignee ID format' });
    }
    
    // Verify that the user exists in the database
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [created_by]);
    if (users.length === 0) {
      console.error('User not found in database:', created_by);
      return res.status(400).json({ error: 'User not found' });
    }
    
    // Verify equipment exists if provided
    if (cleanEquipmentId) {
      const [equipment] = await pool.execute('SELECT id FROM equipment WHERE id = ?', [cleanEquipmentId]);
      if (equipment.length === 0) {
        console.error('Equipment not found in database:', cleanEquipmentId);
        return res.status(400).json({ error: 'Equipment not found' });
      }
    }
    
    // Verify assignee exists if provided
    if (cleanAssignedTo) {
      const [assignees] = await pool.execute('SELECT id FROM users WHERE id = ?', [cleanAssignedTo]);
      if (assignees.length === 0) {
        console.error('Assignee not found in database:', cleanAssignedTo);
        return res.status(400).json({ error: 'Assignee not found' });
      }
    }
    
    console.log('Processed ticket data:', { title, description, type, priority, status, created_by, assigned_to: cleanAssignedTo, equipment_id: cleanEquipmentId });
    console.log('Data types:', {
      created_by: typeof created_by,
      assigned_to: typeof cleanAssignedTo,
      equipment_id: typeof cleanEquipmentId
    });
    
    // Ensure all values are properly converted to null if undefined
    const finalValues = [
      title, 
      description, 
      type, 
      priority, 
      status, 
      created_by, 
      cleanAssignedTo === undefined ? null : cleanAssignedTo, 
      cleanEquipmentId === undefined ? null : cleanEquipmentId
    ];
    
    console.log('Executing INSERT query with values:', finalValues);
    
    const [result] = await pool.execute(
      'INSERT INTO tickets (title, description, type, priority, status, created_by, assigned_to, equipment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      finalValues
    );

    console.log('INSERT result:', result);
    console.log('New ticket ID:', result.insertId);

    const [ticket] = await pool.execute(
      'SELECT * FROM tickets WHERE id = ?',
      [result.insertId]
    );

    console.log('Retrieved ticket:', ticket[0]);

    // Create notifications for relevant users
    try {
      const createdTicket = ticket[0];
      // Fetch potential recipients
      const [allUsers] = await pool.execute(
        'SELECT id, role, department_id, name FROM users'
      );

      const recipients = allUsers.filter((u) => {
        if (u.role === 'admin' || u.role === 'it_personnel') return true;
        if (createdTicket.target_department_id && u.department_id === createdTicket.target_department_id) return true;
        if (createdTicket.department_id && u.department_id === createdTicket.department_id) return true;
        return false;
      }).filter((u) => u.id !== createdTicket.created_by);

      if (recipients.length > 0) {
        const title = 'Nouveau ticket créé';
        const message = `Un nouveau ticket "${createdTicket.title}" a été créé.`;
        // Insert notifications one-by-one to keep it simple and robust
        for (const r of recipients) {
          await pool.execute(
            'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
            [r.id, 'info', title, message]
          );
        }
      }
    } catch (notifyError) {
      console.error('Failed to create notifications for new ticket:', notifyError);
      // Do not fail the request because of notification issues
    }

    res.status(201).json(ticket[0]);
  } catch (error) {
    console.error('Create ticket error:', error);
    console.error('Error details:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Error Code:', error.errno);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Check if it's a foreign key constraint error
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: 'Invalid reference data', 
        details: 'The user or equipment referenced does not exist' 
      });
    }
    
    // Check if it's a data type error
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_TYPE') {
      return res.status(400).json({ 
        error: 'Invalid data type', 
        details: 'One or more fields contain invalid data types' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.put('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, priority } = req.body;
    
    const updates = [];
    const params = [];
    
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to || null);
    }
    
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    
    if (status === 'Résolu') {
      updates.push('resolved_at = NOW()');
    }
    
    params.push(id);
    
    await pool.execute(
      `UPDATE tickets SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    const [tickets] = await pool.execute(
      `SELECT t.*, 
              u1.name as creator_name,
              u2.name as assignee_name,
              e.name as equipment_name
       FROM tickets t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       LEFT JOIN equipment e ON t.equipment_id = e.id
       WHERE t.id = ?`,
      [id]
    );

    try {
      const updated = tickets[0];
      if (status !== undefined) {
        const recipients = [updated.created_by, updated.assigned_to].filter(v => v);
        await createNotificationsForUsers(recipients, 'info', 'Statut du ticket modifié', `Le ticket "${updated.title}" est maintenant: ${updated.status}.`);
      }
    } catch (notifyErr) {
      console.error('Failed to notify ticket status update:', notifyErr);
    }
    res.json(tickets[0]);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    // Check if ticket exists
    const [existingTickets] = await pool.execute(
      'SELECT id, title, created_by FROM tickets WHERE id = ?',
      [ticketId]
    );
    
    if (existingTickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const ticket = existingTickets[0];
    
    // Only ticket creator or admin can delete tickets
    if (req.user.role !== 'admin' && ticket.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own tickets' });
    }
    
    // Delete the ticket (comments will be automatically deleted due to CASCADE)
    await pool.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced ticket management
app.put('/api/tickets/:id/assign', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { userId } = req.body;
    
    // Check if ticket exists
    const [existingTickets] = await pool.execute(
      'SELECT id, title, status FROM tickets WHERE id = ?',
      [ticketId]
    );
    
    if (existingTickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Check if user exists and has appropriate role
    if (userId) {
      const [existingUsers] = await pool.execute(
        'SELECT id, name, role FROM users WHERE id = ?',
        [userId]
      );
      
      if (existingUsers.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (existingUsers[0].role === 'employee') {
        return res.status(403).json({ error: 'Employees cannot be assigned to tickets' });
      }
    }
    
    // Update ticket assignment
    await pool.execute(
      'UPDATE tickets SET assigned_to = ?, status = ? WHERE id = ?',
      [userId || null, userId ? 'En cours' : 'Ouvert', ticketId]
    );
    
    // Get updated ticket
    const [updatedTickets] = await pool.execute(
      `SELECT t.*, 
              u1.name as creator_name,
              u2.name as assignee_name,
              e.name as equipment_name
       FROM tickets t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       LEFT JOIN equipment e ON t.equipment_id = e.id
       WHERE t.id = ?`,
      [ticketId]
    );

    // Create a notification for the newly assigned user
    try {
      const updated = updatedTickets[0];
      if (userId) {
        await pool.execute(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [userId, 'info', 'Ticket assigné', `Vous avez été assigné au ticket "${updated.title}".`]
        );
      }
    } catch (notifyError) {
      console.error('Failed to create assignment notification:', notifyError);
    }

    res.json(updatedTickets[0]);
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tickets/:id/close', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    // Check if ticket exists
    const [existingTickets] = await pool.execute(
      'SELECT id, title, status, created_by FROM tickets WHERE id = ?',
      [ticketId]
    );
    
    if (existingTickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const ticket = existingTickets[0];
    
    // Only ticket creator, assignee, or admin can close tickets
    if (req.user.role !== 'admin' && 
        ticket.created_by !== req.user.id && 
        ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only close tickets you created or are assigned to' });
    }
    
    // Close the ticket
    await pool.execute(
      'UPDATE tickets SET status = ?, resolved_at = NOW(), updated_at = NOW() WHERE id = ?',
      ['Fermé', ticketId]
    );
    
    // Get updated ticket
    const [updatedTickets] = await pool.execute(
      `SELECT t.*, 
              u1.name as creator_name,
              u2.name as assignee_name,
              e.name as equipment_name
       FROM tickets t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       LEFT JOIN equipment e ON t.equipment_id = e.id
       WHERE t.id = ?`,
      [ticketId]
    );
    
    res.json(updatedTickets[0]);
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tickets/:id/escalate', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    
    // Check if ticket exists
    const [existingTickets] = await pool.execute(
      'SELECT id, title, status, priority FROM tickets WHERE id = ?',
      [ticketId]
    );
    
    if (existingTickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const ticket = existingTickets[0];
    
    // Only IT personnel or admin can escalate tickets
    if (req.user.role === 'employee') {
      return res.status(403).json({ error: 'Employees cannot escalate tickets' });
    }
    
    // Escalate the ticket
    let newPriority = ticket.priority;
    if (ticket.priority === 'Basse') newPriority = 'Normale';
    else if (ticket.priority === 'Normale') newPriority = 'Haute';
    else if (ticket.priority === 'Haute') newPriority = 'Urgente';
    
    await pool.execute(
      'UPDATE tickets SET priority = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [newPriority, 'Escaladé', ticketId]
    );
    
    // Get updated ticket
    const [updatedTickets] = await pool.execute(
      `SELECT t.*, 
              u1.name as creator_name,
              u2.name as assignee_name,
              e.name as equipment_name
       FROM tickets t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       LEFT JOIN equipment e ON t.equipment_id = e.id
       WHERE t.id = ?`,
      [ticketId]
    );
    
    res.json(updatedTickets[0]);
  } catch (error) {
    console.error('Escalate ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ticket comments routes
app.get('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [comments] = await pool.execute(
      `SELECT tc.*, u.name as author_name
       FROM ticket_comments tc
       JOIN users u ON tc.author_id = u.id
       WHERE tc.ticket_id = ?
       ORDER BY tc.created_at ASC`,
      [id]
    );

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO ticket_comments (ticket_id, content, author_id) VALUES (?, ?, ?)',
      [id, content, req.user.id]
    );

    const [comments] = await pool.execute(
      `SELECT tc.*, u.name as author_name
       FROM ticket_comments tc
       JOIN users u ON tc.author_id = u.id
       WHERE tc.id = ?`,
      [result.insertId]
    );

    // Notify ticket creator and assignee of the new comment
    try {
      const [ticketsRows] = await pool.execute('SELECT title, created_by, assigned_to FROM tickets WHERE id = ?', [id]);
      if (ticketsRows.length > 0) {
        const t = ticketsRows[0];
        const recipients = [t.created_by, t.assigned_to].filter(v => v && v !== req.user.id);
        await createNotificationsForUsers(recipients, 'info', 'Nouveau commentaire', `Nouveau commentaire sur le ticket "${t.title}".`);
      }
    } catch (notifyErr) {
      console.error('Failed to notify new comment:', notifyErr);
    }

    res.status(201).json(comments[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tickets/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { id: ticketId, commentId } = req.params;
    const { content } = req.body;
    
    // Check if comment exists and belongs to the user
    const [existingComments] = await pool.execute(
      'SELECT id, author_id FROM ticket_comments WHERE id = ? AND ticket_id = ?',
      [commentId, ticketId]
    );
    
    if (existingComments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const comment = existingComments[0];
    
    // Only comment author or admin can edit comments
    if (req.user.role !== 'admin' && comment.author_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }
    
    // Update the comment
    await pool.execute(
      'UPDATE ticket_comments SET content = ? WHERE id = ?',
      [content, commentId]
    );
    
    // Get updated comment
    const [updatedComments] = await pool.execute(
      `SELECT tc.*, u.name as author_name
       FROM ticket_comments tc
       JOIN users u ON tc.author_id = u.id
       WHERE tc.id = ?`,
      [commentId]
    );
    
    res.json(updatedComments[0]);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/tickets/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { id: ticketId, commentId } = req.params;
    
    // Check if comment exists and belongs to the user
    const [existingComments] = await pool.execute(
      'SELECT id, author_id FROM ticket_comments WHERE id = ? AND ticket_id = ?',
      [commentId, ticketId]
    );
    
    if (existingComments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const comment = existingComments[0];
    
    // Only comment author or admin can delete comments
    if (req.user.role !== 'admin' && comment.author_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    
    // Delete the comment
    await pool.execute(
      'DELETE FROM ticket_comments WHERE id = ?',
      [commentId]
    );
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notification routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Check if notification exists and belongs to the user
    const [existingNotifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );
    
    if (existingNotifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Mark notification as read
    await pool.execute(
      'UPDATE notifications SET `read` = TRUE WHERE id = ?',
      [notificationId]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Check if notification exists and belongs to the user
    const [existingNotifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );
    
    if (existingNotifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Delete the notification
    await pool.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ASCII Art for Olayya
const olayyaArt = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ██████╗ ██╗      █████╗ ██╗   ██╗██╗   ██╗ █████╗         ║
║   ██╔═══██╗██║     ██╔══██╗╚██╗ ██╔╝╚██╗ ██╔╝██╔══██╗        ║
║   ██║   ██║██║     ███████║ ╚████╔╝  ╚████╔╝ ███████║        ║
║   ██║   ██║██║     ██╔══██║  ╚██╔╝    ╚██╔╝  ██╔══██║        ║
║   ╚██████╔╝███████╗██║  ██║   ██║      ██║   ██║  ██║        ║
║    ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝        ║
║                                                              ║
║                    Developed by Olayya                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

// Function to get network IP addresses
async function getNetworkIPs() {
  const { networkInterfaces } = await import('os');
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          interface: name,
          address: net.address
        });
      }
    }
  }
  return results;
}

app.listen(PORT, async () => {
  // Clear console for clean startup
  console.clear();
  
  // Check database connection
  let dbStatus = '❌ Disconnected';
  try {
    const connection = await pool.getConnection();
    connection.release();
    dbStatus = '✅ Connected';
  } catch (error) {
    dbStatus = '❌ Disconnected';
  }

  // Display startup information
  console.log('\nStarting Helpdesk Ticketing System...\n');
  
  console.log('System Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Server:     Running on port ${PORT}`);
  console.log(`   Database:   ${dbStatus === '✅ Connected' ? 'Connected' : 'Disconnected'}`);
  console.log(`   APIs:       All endpoints active`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Display Olayya ASCII art
  console.log(olayyaArt);

  // Display access URLs in table format
  console.log('Access URLs:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('│ Type      │ URL                                    ');
  console.log('├───────────┼────────────────────────────────────────');
  console.log(`│ Local     │ http://localhost:${PORT}              `);
  console.log(`│ Frontend  │ http://localhost:5173                  `);
  
  // Display network IPs if available
  try {
    const networkIPs = await getNetworkIPs();
    if (networkIPs.length > 0) {
      networkIPs.forEach((ip, index) => {
        const url = `http://${ip.address}:${PORT}`;
        const paddedUrl = url.padEnd(36);
        console.log(`│ Network   │ ${paddedUrl} `);
      });
    }
  } catch (error) {
    // Network IP detection failed, continue without it
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('System ready! Press Ctrl+C to stop.\n');
});