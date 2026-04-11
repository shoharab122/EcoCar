-- 1️⃣ Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ecocar;

-- 2️⃣ Use the database
USE ecocar;

-- 3️⃣ Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4️⃣ Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5️⃣ Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 6️⃣ Insert sample products if table is empty
INSERT INTO products (name, description, price, image_url)
SELECT 'Ocean Breeze', 'Fresh and calming oceanic scent with notes of sea salt and jasmine', 29.99, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200'
WHERE NOT EXISTS (SELECT 1 FROM products);

INSERT INTO products (name, description, price, image_url)
SELECT 'Midnight Oud', 'Rich woody fragrance for evenings with agarwood and sandalwood', 49.99, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Midnight Oud');

INSERT INTO products (name, description, price, image_url)
SELECT 'Citrus Burst', 'Zesty orange and lemon notes with a hint of bergamot', 19.99, 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=200'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Citrus Burst');

INSERT INTO products (name, description, price, image_url)
SELECT 'Rose Velvet', 'Elegant rose with hints of vanilla and musk', 39.99, 'https://img.drz.lazcdn.com/static/bd/p/3fc42d629c6658431ff101f1db89aa5c.png_400x400q75.avif'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Rose Velvet');

INSERT INTO products (name, description, price, image_url)
SELECT 'Amber Night', 'Warm amber with vanilla and tonka bean', 44.99, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Amber Night');

INSERT INTO products (name, description, price, image_url)
SELECT 'Fresh Linen', 'Clean cotton and white musk for everyday wear', 24.99, 'https://images.unsplash.com/photo-1616949755611-7c890dabc1a9?w=200'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Fresh Linen');

-- ✅ Check final products
SELECT * FROM products;