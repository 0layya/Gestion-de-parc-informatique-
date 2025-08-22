# HELPDESK TICKETING SYSTEM - Technical Documentation

## System Architecture

### 🏗️ **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0+
- **Authentication**: JWT (JSON Web Tokens) + bcrypt
- **Styling**: Tailwind CSS + Lucide React Icons
- **Build Tool**: Vite with TypeScript configuration
- **Package Manager**: npm/pnpm

### 🔧 **Architecture Pattern**
- **Client-Server Architecture**: RESTful API with React SPA frontend
- **Context API**: React Context for state management
- **Component-Based**: Modular React components with TypeScript interfaces
- **RESTful API**: Standard HTTP methods for data operations
- **Middleware Architecture**: Express.js middleware for authentication and validation

## Project Structure

```
HELPDESK TICKETING/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── Auth/                # Authentication components
│   │   ├── Dashboard/           # Dashboard and analytics
│   │   ├── Equipment/           # Equipment management
│   │   ├── Layout/              # Main layout and navigation
│   │   ├── Tickets/             # Ticket management
│   │   └── Users/               # User and department management
│   ├── context/                 # React Context providers
│   ├── services/                # API service layer
│   ├── types/                   # TypeScript type definitions
│   └── main.tsx                 # Application entry point
├── server/                      # Backend server code
│   ├── config/                  # Database configuration
│   └── server.js                # Main server file
├── DATABASE/                    # Database migrations and schema
└── scripts/                     # Utility scripts
```

## Database Schema

### 📊 **Core Tables**

#### 1. **users** Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'it_personnel', 'employee') NOT NULL DEFAULT 'employee',
    department_id INT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);
```

**Fields:**
- `id`: Unique user identifier
- `name`: Full name of the user
- `email`: Unique email address (used for login)
- `password`: Hashed password using bcrypt
- `role`: User role with specific permissions
- `department_id`: Reference to user's department
- `avatar_url`: Optional profile picture URL
- `created_at`: Account creation timestamp
- `created_by`: ID of user who created this account

#### 2. **departments** Table
```sql
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    manager_id INT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Fields:**
- `id`: Unique department identifier
- `name`: Department name (unique)
- `description`: Department description
- `manager_id`: Reference to department manager
- `permissions`: JSON object defining department permissions
- `created_at`: Department creation timestamp
- `updated_at`: Last modification timestamp

#### 3. **equipment** Table
```sql
CREATE TABLE equipment (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);
```

**Fields:**
- `id`: Unique equipment identifier
- `name`: Equipment name/description
- `type`: Equipment category
- `brand`: Manufacturer brand
- `model`: Specific model number
- `serial_number`: Unique serial number
- `status`: Current equipment status
- `assigned_to_id`: User currently using the equipment
- `department_id`: Department owning the equipment
- `location`: Physical location of equipment
- `purchase_date`: Date of purchase
- `warranty_expiry`: Warranty expiration date
- `notes`: Additional information
- `created_at`: Equipment registration timestamp

#### 4. **tickets** Table
```sql
CREATE TABLE tickets (
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
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (target_department_id) REFERENCES departments(id) ON DELETE SET NULL
);
```

**Fields:**
- `id`: Unique ticket identifier
- `title`: Ticket title/summary
- `description`: Detailed description of the issue
- `type`: Type of support request
- `priority`: Priority level
- `status`: Current ticket status
- `created_by`: User who created the ticket
- `assigned_to`: IT personnel assigned to resolve
- `equipment_id`: Related equipment (if applicable)
- `department_id`: Department where issue occurred
- `target_department_id`: Department responsible for resolution
- `created_at`: Ticket creation timestamp
- `updated_at`: Last modification timestamp
- `resolved_at`: Resolution timestamp

#### 5. **ticket_comments** Table
```sql
CREATE TABLE ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `id`: Unique comment identifier
- `ticket_id`: Reference to parent ticket
- `content`: Comment text content
- `author_id`: User who wrote the comment
- `created_at`: Comment creation timestamp

#### 6. **notifications** Table
```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('success', 'error', 'warning', 'info') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    `read` BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `id`: Unique notification identifier
- `user_id`: User receiving the notification
- `type`: Notification type/category
- `title`: Notification title
- `message`: Notification content
- `read`: Read status flag
- `created_at`: Notification creation timestamp

### 🔗 **Database Relationships**

#### Foreign Key Constraints
- **users.department_id** → **departments.id** (Many-to-One)
- **departments.manager_id** → **users.id** (One-to-One)
- **equipment.assigned_to_id** → **users.id** (Many-to-One)
- **equipment.department_id** → **departments.id** (Many-to-One)
- **tickets.created_by** → **users.id** (Many-to-One)
- **tickets.assigned_to** → **users.id** (Many-to-One)
- **tickets.equipment_id** → **equipment.id** (Many-to-One)
- **tickets.department_id** → **departments.id** (Many-to-One)
- **tickets.target_department_id** → **departments.id** (Many-to-One)
- **ticket_comments.ticket_id** → **tickets.id** (Many-to-One)
- **ticket_comments.author_id** → **users.id** (Many-to-One)
- **notifications.user_id** → **users.id** (Many-to-One)

## API Endpoints

### 🔐 **Authentication Endpoints**

#### POST `/api/auth/login`
- **Purpose**: User authentication
- **Request Body**: `{ email: string, password: string }`
- **Response**: `{ user: User, token: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 500 (Server Error)

#### POST `/api/auth/register`
- **Purpose**: User registration
- **Request Body**: `{ name: string, email: string, password: string, role: string }`
- **Response**: `{ user: User, token: string }`
- **Status Codes**: 201 (Created), 400 (Bad Request), 500 (Server Error)

#### POST `/api/auth/logout`
- **Purpose**: User logout
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

### 👥 **User Management Endpoints**

#### GET `/api/users`
- **Purpose**: Retrieve all users
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `User[]`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 403 (Forbidden)

#### POST `/api/users`
- **Purpose**: Create new user
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `UserFormData`
- **Response**: `User`
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden)

#### PUT `/api/users/:id`
- **Purpose**: Update user
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `Partial<User>`
- **Response**: `User`
- **Status Codes**: 200 (Success), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### DELETE `/api/users/:id`
- **Purpose**: Delete user
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

### 🏢 **Department Management Endpoints**

#### GET `/api/departments`
- **Purpose**: Retrieve all departments
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `Department[]`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

#### POST `/api/departments`
- **Purpose**: Create new department
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `DepartmentFormData`
- **Response**: `Department`
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden)

#### PUT `/api/departments/:id`
- **Purpose**: Update department
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `Partial<Department>`
- **Response**: `Department`
- **Status Codes**: 200 (Success), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### DELETE `/api/departments/:id`
- **Purpose**: Delete department
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

### 🖥️ **Equipment Management Endpoints**

#### GET `/api/equipment`
- **Purpose**: Retrieve all equipment
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `Equipment[]`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

#### POST `/api/equipment`
- **Purpose**: Create new equipment
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `Omit<Equipment, 'id' | 'created_at'>`
- **Response**: `Equipment`
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden)

#### PUT `/api/equipment/:id`
- **Purpose**: Update equipment
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `Partial<Equipment>`
- **Response**: `Equipment`
- **Status Codes**: 200 (Success), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### DELETE `/api/equipment/:id`
- **Purpose**: Delete equipment
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

### 📋 **Ticket Management Endpoints**

#### GET `/api/tickets`
- **Purpose**: Retrieve all tickets
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `Ticket[]`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

#### POST `/api/tickets`
- **Purpose**: Create new ticket
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `Omit<Ticket, 'id' | 'created_at' | 'updated_at'>`
- **Response**: `Ticket`
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized)

#### PUT `/api/tickets/:id`
- **Purpose**: Update ticket
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `Partial<Ticket>`
- **Response**: `Ticket`
- **Status Codes**: 200 (Success), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### DELETE `/api/tickets/:id`
- **Purpose**: Delete ticket
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)

#### POST `/api/tickets/:id/comments`
- **Purpose**: Add comment to ticket
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ content: string }`
- **Response**: `TicketComment`
- **Status Codes**: 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found)

### 🔔 **Notification Endpoints**

#### GET `/api/notifications`
- **Purpose**: Retrieve user notifications
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `Notification[]`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

#### PUT `/api/notifications/:id/read`
- **Purpose**: Mark notification as read
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 404 (Not Found)

#### DELETE `/api/notifications/:id`
- **Purpose**: Delete notification
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: string }`
- **Status Codes**: 200 (Success), 401 (Unauthorized), 404 (Not Found)

## Frontend Architecture

### 🎯 **Component Structure**

#### Authentication Components
- **Login.tsx**: User login form with email/password
- **Register.tsx**: User registration form
- **AuthContext.tsx**: Authentication state management

#### Layout Components
- **Layout.tsx**: Main application layout with navigation
- **Navigation**: Sidebar navigation with role-based menu items
- **Header**: Top header with user profile and notifications

#### Dashboard Components
- **Dashboard.tsx**: Main dashboard with statistics and charts
- **StatCard**: Individual statistic display component
- **ChartCard**: Chart container component

#### Ticket Management
- **TicketList.tsx**: List of all tickets with filtering
- **TicketForm.tsx**: Create/edit ticket form
- **TicketDetail.tsx**: Detailed ticket view with comments

#### Equipment Management
- **EquipmentList.tsx**: List of all equipment
- **EquipmentForm.tsx**: Create/edit equipment form
- **StockManagement.tsx**: Equipment inventory management

#### User Management
- **UserManagement.tsx**: User list and management
- **UserForm.tsx**: Create/edit user form
- **DepartmentManagement.tsx**: Department management
- **Profile.tsx**: User profile management

### 🔄 **State Management**

#### Context Providers
- **AuthContext**: Manages user authentication state
- **AppContext**: Manages application data (tickets, equipment, users)
- **NotificationContext**: Manages system notifications

#### State Structure
```typescript
// Auth State
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// App State
interface AppState {
  equipment: Equipment[];
  tickets: Ticket[];
  users: User[];
  departments: Department[];
}

// Notification State
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isMuted: boolean;
}
```

### 🎨 **Styling & UI**

#### Design System
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first responsive layout
- **Color Scheme**: Consistent color palette with semantic meanings
- **Typography**: Clear hierarchy with proper font weights
- **Spacing**: Consistent spacing scale using Tailwind utilities

#### Component Patterns
- **Card Components**: Consistent card design for content
- **Form Components**: Standardized form inputs and validation
- **Button Components**: Consistent button styles and states
- **Modal Components**: Reusable modal dialogs
- **Table Components**: Data table with sorting and filtering

## Security Features

### 🔐 **Authentication & Authorization**

#### JWT Implementation
- **Token Storage**: Secure token storage in localStorage
- **Token Expiration**: Automatic token refresh and expiration handling
- **Secure Headers**: Authorization headers for API requests

#### Role-Based Access Control
- **Admin Role**: Full system access
- **IT Personnel Role**: Equipment and ticket management
- **Employee Role**: Basic ticket creation and viewing

#### Permission System
- **Department Permissions**: Granular permissions per department
- **Resource Access**: Role-based resource access control
- **API Protection**: Protected API endpoints with middleware

### 🛡️ **Data Security**

#### Input Validation
- **Server-side Validation**: Express.js validation middleware
- **Client-side Validation**: React form validation
- **SQL Injection Prevention**: Parameterized queries

#### Data Encryption
- **Password Hashing**: bcrypt password hashing
- **HTTPS**: Secure communication (in production)
- **Session Security**: Secure session management

## Performance & Optimization

### ⚡ **Frontend Optimization**

#### React Optimization
- **Component Memoization**: React.memo for expensive components
- **Lazy Loading**: Code splitting for route-based components
- **Virtual Scrolling**: Efficient list rendering for large datasets

#### Bundle Optimization
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Split code into smaller chunks
- **Asset Optimization**: Optimized images and static assets

### 🚀 **Backend Optimization**

#### Database Optimization
- **Indexing**: Proper database indexes for queries
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized SQL queries

#### Caching Strategy
- **Response Caching**: Cache frequently accessed data
- **Database Caching**: Query result caching
- **Static Asset Caching**: Browser caching for static files

## Deployment & Configuration

### 🌐 **Environment Configuration**

#### Environment Variables
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ticketing_system

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Build Configuration
- **Development**: Hot reload with Vite dev server
- **Production**: Optimized build with Vite
- **Testing**: Jest testing framework setup

### 🐳 **Deployment Options**

#### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend server
npm run server

# Start both servers
npm run dev:full
```

#### Production Deployment
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Monitoring & Maintenance

### 📊 **System Monitoring**

#### Health Checks
- **API Health Endpoint**: `/api/health`
- **Database Connectivity**: Connection status monitoring
- **Service Status**: Individual service health checks

#### Logging
- **Request Logging**: HTTP request/response logging
- **Error Logging**: Comprehensive error logging
- **Performance Logging**: Response time and resource usage

### 🔧 **Maintenance Tasks**

#### Database Maintenance
- **Regular Backups**: Automated database backups
- **Index Optimization**: Regular index maintenance
- **Data Cleanup**: Archive old tickets and notifications

#### System Updates
- **Security Updates**: Regular security patches
- **Feature Updates**: New feature deployments
- **Performance Updates**: Performance optimization updates

This technical documentation provides a comprehensive overview of the system architecture, implementation details, and technical considerations for developers and system administrators working with the Helpdesk Ticketing System.
