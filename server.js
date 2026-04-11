const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(session({
    secret: process.env.SESSION_SECRET || 'ecocar-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Shoharabchy',
    database: process.env.DB_NAME || 'ecocar'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database');
    initializeDatabase();
});

function initializeDatabase() {
    // Add avatar column if missing
    db.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(50) DEFAULT 'avatar1'`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Error adding avatar column:', err);
        else console.log('✅ Avatar column ready');
    });

    // Add status column to orders if missing
    db.query(`ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending'`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Error adding status column:', err);
        else console.log('✅ Status column ready');
    });

    // Users table
    db.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(50) DEFAULT 'avatar1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error(err); else console.log('✅ Users table ready'); });

    // Products table
    db.query(`CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error(err); else console.log('✅ Products table ready'); });

    // Cart items table
    db.query(`CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`, (err) => { if (err) console.error(err); else console.log('✅ Cart table ready'); });

    // Orders table
    db.query(`CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        fullName VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        items JSON NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => { if (err) console.error('Error creating orders table:', err); else console.log('✅ Orders table ready'); });

    // Insert sample products if empty
    db.query('SELECT COUNT(*) as count FROM products', (err, results) => {
        if (err) return console.error(err);
        if (results[0].count === 0) {
            const sampleProducts = [
                ['Ocean Breeze', 'Fresh and calming oceanic scent with notes of sea salt and jasmine', 29.99, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200'],
                ['Midnight Oud', 'Rich woody fragrance for evenings with agarwood and sandalwood', 49.99, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200'],
                ['Citrus Burst', 'Zesty orange and lemon notes with a hint of bergamot', 19.99, 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=200'],
                ['Rose Velvet', 'Elegant rose with hints of vanilla and musk', 39.99, 'https://images.unsplash.com/photo-1547887537-e3a2d32d8320?w=200'],
                ['Amber Night', 'Warm amber with vanilla and tonka bean', 44.99, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200'],
                ['Fresh Linen', 'Clean cotton and white musk for everyday wear', 24.99, 'https://images.unsplash.com/photo-1616949755611-7c890dabc1a9?w=200']
            ];
            sampleProducts.forEach(product => {
                db.query('INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)', product);
            });
            console.log('✅ Sample products inserted');
        }
    });
}

// ========== API ROUTES ==========

// Get all products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products ORDER BY id', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(results[0]);
    });
});

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username already exists' });
                return res.status(500).json({ error: 'Database error' });
            }
            req.session.userId = result.insertId;
            req.session.username = username;
            console.log(`✅ New user registered: ${username} (ID: ${result.insertId})`);
            res.json({ success: true, message: 'Registration successful', user: { id: result.insertId, username } });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid username or password' });
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid username or password' });
        req.session.userId = user.id;
        req.session.username = user.username;
        console.log(`✅ User logged in: ${username} (ID: ${user.id})`);
        res.json({ success: true, message: 'Login successful', user: { id: user.id, username: user.username, avatar: user.avatar || 'avatar1' } });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Could not log out' });
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Get current user (includes avatar)
app.get('/api/user', (req, res) => {
    if (!req.session.userId) return res.json({ loggedIn: false });
    db.query('SELECT username, avatar FROM users WHERE id = ?', [req.session.userId], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ error: 'Database error' });
        res.json({ loggedIn: true, user: { id: req.session.userId, username: results[0].username, avatar: results[0].avatar || 'avatar1' } });
    });
});

// Update avatar
app.post('/api/avatar', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Please login' });
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ error: 'Avatar required' });
    db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.session.userId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, avatar });
    });
});

// Cart endpoints
app.get('/api/cart', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Please login' });
    const query = `
        SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, (p.price * ci.quantity) as subtotal
        FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ? ORDER BY ci.added_at DESC`;
    db.query(query, [req.session.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const total = results.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        res.json({ items: results, total: total.toFixed(2), itemCount: results.length });
    });
});

app.post('/api/cart/add', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Please login' });
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID required' });
    db.query('SELECT * FROM products WHERE id = ?', [productId], (err, productResults) => {
        if (err || productResults.length === 0) return res.status(404).json({ error: 'Product not found' });
        db.query('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.session.userId, productId], (err, cartResults) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (cartResults.length > 0) {
                db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, cartResults[0].id], (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ success: true, message: 'Cart updated' });
                });
            } else {
                db.query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.session.userId, productId, quantity], (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ success: true, message: 'Item added to cart' });
                });
            }
        });
    });
});

app.put('/api/cart/update/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });
    db.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.session.userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ success: true, message: 'Cart updated' });
    });
});

app.delete('/api/cart/remove/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    db.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
        res.json({ success: true, message: 'Item removed' });
    });
});

app.delete('/api/cart/clear', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    db.query('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, message: 'Cart cleared' });
    });
});

// Save order to database
app.post('/api/place-order', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Please login to place order' });
    }
    const { fullName, address, phone, items, total } = req.body;
    if (!fullName || !address || !phone || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing order details' });
    }

    const orderItems = JSON.stringify(items);
    db.query(
        'INSERT INTO orders (user_id, username, fullName, address, phone, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.session.userId, req.session.username, fullName, address, phone, orderItems, total, 'pending'],
        (err, result) => {
            if (err) {
                console.error('Error saving order:', err);
                return res.status(500).json({ error: 'Could not save order' });
            }
            console.log(`✅ Order #${result.insertId} saved for ${req.session.username} (status: pending)`);

            // Clear cart after successful order
            db.query('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId], (err) => {
                if (err) console.error('Error clearing cart:', err);
                res.json({ success: true, message: 'Order placed successfully! Thank you for shopping with EcoCar.', orderId: result.insertId });
            });
        }
    );
});

// Admin: get all orders (only if logged in as admin)
app.get('/api/admin/orders', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.session.username !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    db.query('SELECT * FROM orders ORDER BY order_date DESC', (err, orders) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        orders.forEach(order => {
            if (typeof order.items === 'string') order.items = JSON.parse(order.items);
        });
        res.json(orders);
    });
});

// Admin: update order status
app.put('/api/admin/order/:id/status', (req, res) => {
    if (!req.session.userId || req.session.username !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    const { status } = req.body;
    const orderId = req.params.id;
    if (!status) return res.status(400).json({ error: 'Status required' });
    
    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
        console.log(`✅ Order #${orderId} status updated to: ${status}`);
        res.json({ success: true, message: `Order #${orderId} status updated to ${status}` });
    });
});

// Admin: delete an order (only if logged in as admin)
app.delete('/api/admin/order/:id', (req, res) => {
    if (!req.session.userId || req.session.username !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    const orderId = req.params.id;
    db.query('DELETE FROM orders WHERE id = ?', [orderId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
        console.log(`🗑️ Order #${orderId} deleted by admin`);
        res.json({ success: true, message: `Order #${orderId} deleted` });
    });
});

// User: get my orders (for logged-in customers)
app.get('/api/my-orders', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Please login' });
    db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC', [req.session.userId], (err, orders) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        orders.forEach(order => {
            if (typeof order.items === 'string') order.items = JSON.parse(order.items);
        });
        res.json(orders);
    });
});

// Serve cart page explicitly
app.get('/cart.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'cart.html'));
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'apps.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 EcoCar Server running on http://localhost:${PORT}`);
});