import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

//chercher les dépendances
function checkDependencies() {
  console.log('Checking dependencies...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('package.json not found');
    return false;
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('node_modules not found - dependencies need to be installed');
    return false;
  }
  
  console.log('Dependencies are installed');
  return true;
}

// installer les dépendances
function installDependencies() {
  console.log('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('Dependencies installed successfully');
    return true;
  } catch (error) {
    console.log('Failed to install dependencies');
    return false;
  }
}

// vérifier la connexion à la base de données
async function checkDatabase() {
  console.log('Checking database connection...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ticketing_system'
  };
  
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // Cheercher si la base de données existe
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [dbConfig.database]);
    
    if (databases.length === 0) {
      console.log('Database does not exist - creating...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log('Database created successfully');
    } else {
      console.log('Database exists');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.log('Database connection failed:', error.message);
    console.log('   Please make sure XAMPP MySQL service is running');
    return false;
  }
}

// créer les tables dans la base de données
async function setupDatabase() {
  console.log('Setting up database tables...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ticketing_system'
  };
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Lire et exécuter le fichier SQL de migration
    const sqlFilePath = path.join(__dirname, '..', 'DATABASE', 'migrations', '20250809204431_cool_snowflake.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      const statements = sqlContent.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.execute(statement);
        }
      }
      
      console.log('Database tables created successfully');
    } else {
      console.log('SQL migration file not found');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.log('Failed to setup database tables:', error.message);
    return false;
  }
}

// récupérer les adresses IP du réseau
async function getNetworkIPs() {
  const { networkInterfaces } = await import('os');
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
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

// fonction principale de démarrage
async function startup() {
  console.clear();
  console.log('\nHelpdesk Ticketing System - Startup Check\n');
  
  // Chercher les dépendances
  if (!checkDependencies()) {
    console.log('\nInstalling dependencies...');
    if (!installDependencies()) {
      console.log('Failed to install dependencies. Please run "npm install" manually.');
      process.exit(1);
    }
  }
  
  // chercher la connexion à la base de données
  if (!await checkDatabase()) {
    console.log('\nDatabase connection failed. Please:');
    console.log('   1. Start XAMPP and ensure MySQL service is running');
    console.log('   2. Check your .env file configuration');
    console.log('   3. Run the startup script again');
    process.exit(1);
  }
  
  // créer les tables dans la base de données
  if (!await setupDatabase()) {
    console.log('\nFailed to setup database tables');
    process.exit(1);
  }
  
  console.log('\nAll checks passed! Starting the application...\n');
  

  
  // Afficher les URLs d'accès
  console.log('Access URLs:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('│ Type      │ URL                                    │');
  console.log('├───────────┼────────────────────────────────────────┤');
  console.log('│ Local     │ http://localhost:3001                  │');
  console.log('│ Frontend  │ http://localhost:5173                  │');
  
  // Récupérer et afficher les adresses IP du réseau
  try {
    const networkIPs = await getNetworkIPs();
    if (networkIPs.length > 0) {
      networkIPs.forEach((ip, index) => {
        const url = `http://${ip.address}:5173`;
        const paddedUrl = url.padEnd(36);
        console.log(`│ Network   │ ${paddedUrl} │`);
      });
    }
  } catch (error) {
    // Ignorer les erreurs de récupération des IP
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('System ready! Starting servers...\n');
  
  // Démarrer les serveurs
  try {
    execSync('npm run dev:full', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.log('Failed to start the application');
    process.exit(1);
  }
}

// Lancer la fonction principale
startup().catch(console.error);
