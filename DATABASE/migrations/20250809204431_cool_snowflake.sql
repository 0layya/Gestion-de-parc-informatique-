-- Create database
CREATE DATABASE IF NOT EXISTS ticketing_system;
USE ticketing_system;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'it_personnel', 'employee') NOT NULL DEFAULT 'employee',
    department_id INT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT
    -- Removed foreign key constraint to avoid issues with initial user creation
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    manager_id INT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('PC', 'Laptop', 'Clavier', 'Souris', 'Câble', 'Routeur', 'Switch', 'Serveur', 'Écran', 'Imprimante', 'Autre') NOT NULL,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('Disponible', 'En utilisation', 'En panne', 'En maintenance', 'Retiré') NOT NULL DEFAULT 'Disponible',
    assigned_to_id INT,
    department_id INT,
    location VARCHAR(255) NOT NULL,
    purchase_date DATE,
    warranty_expiry DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('Incident', 'Demande', 'Panne', 'Remplacement', 'Installation', 'Maintenance') NOT NULL,
    priority ENUM('Basse', 'Normale', 'Haute', 'Urgente') NOT NULL DEFAULT 'Normale',
    status ENUM('Ouvert', 'En cours', 'Résolu', 'Fermé', 'Escaladé', 'En attente') NOT NULL DEFAULT 'Ouvert',
    created_by INT NOT NULL,
    assigned_to INT,
    equipment_id INT,
    department_id INT,
    target_department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

-- Ticket comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('success', 'error', 'warning', 'info') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    `read` BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure avatar_url column exists (for existing databases)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT AFTER department_id;

-- Add department_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INT AFTER role;

-- Insert default departments
INSERT IGNORE INTO departments (id, name, description, permissions) VALUES 
(1, 'IT', 'Département des technologies de l\'information', '{"tickets": true, "equipment": true, "users": false, "reports": true}'),
(2, 'Marketing', 'Département marketing et communication', '{"tickets": true, "equipment": false, "users": false, "reports": false}'),
(3, 'RH', 'Département des ressources humaines', '{"tickets": true, "equipment": false, "users": false, "reports": false}'),
(4, 'Finance', 'Département financier', '{"tickets": true, "equipment": false, "users": false, "reports": true}');

-- Insert default users with working password hashes
-- admin@ibnzohr.com / admin
-- it@ibnzohr.com / itemployee  
-- olayya@ibnzohr.com / employee
INSERT IGNORE INTO users (id, name, email, password, role, department_id) VALUES 
(1, 'Admin Système', 'admin@ibnzohr.com', '$2b$10$gKjm79eW8/p5qnyo/venHeVaYPnb8CmMtcmuYqRPBVY15xUCjc0zK', 'admin', 1),
(2, 'Support IT', 'it@ibnzohr.com', '$2b$10$9s7uuChIglDe565KFlWdB.p4v.NLwEipvXxtr3aM/jPDPyeKc/EZO', 'it_personnel', 1),
(3, 'OLAYYA ZINEBI', 'olayya@ibnzohr.com', '$2b$10$X4PA3d/Z1yGge5/JfsyTfueSbMBYb6nHYKyR4C3jSogD.QZL.zYAq', 'employee', 2);

-- Update department managers
UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 2 WHERE id = 2;
UPDATE departments SET manager_id = 3 WHERE id = 3;
UPDATE departments SET manager_id = 1 WHERE id = 4;

-- Add foreign key constraints after data insertion
ALTER TABLE users ADD CONSTRAINT fk_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE equipment ADD CONSTRAINT fk_equipment_assigned_to 
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE equipment ADD CONSTRAINT fk_equipment_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE tickets ADD CONSTRAINT fk_tickets_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE tickets ADD CONSTRAINT fk_tickets_assigned_to 
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tickets ADD CONSTRAINT fk_tickets_equipment 
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

ALTER TABLE tickets ADD CONSTRAINT fk_tickets_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE tickets ADD CONSTRAINT fk_tickets_target_department 
    FOREIGN KEY (target_department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE ticket_comments ADD CONSTRAINT fk_ticket_comments_ticket 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

ALTER TABLE ticket_comments ADD CONSTRAINT fk_ticket_comments_author 
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;