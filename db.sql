-- Create database
CREATE DATABASE IF NOT EXISTS ecocar;
USE ecocar;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample products
INSERT INTO products (name, description, price, image_url) VALUES
('Ocean Breeze', 'Fresh and calming oceanic scent', 29.99, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200'),
('Midnight Oud', 'Rich woody fragrance for evenings', 49.99, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200'),
('Citrus Burst', 'Zesty orange and lemon notes', 19.99, 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=200'),
('Rose Velvet', 'Elegant rose with hints of vanilla', 39.99, 'https://images.unsplash.com/photo-1547887537-e3a2d32d8320?w=200');