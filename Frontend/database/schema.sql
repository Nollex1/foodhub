-- Database Schema for Multi-Restaurant Food Ordering Platform
-- PostgreSQL (PgAdmin4)

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurant_images CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Categories Table (Food categories like Nigerian, Chinese, Fast Food, etc.)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities Table (Support multiple countries and cities)
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Nigeria',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city, state, country)
);

-- Restaurants Table
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    address TEXT NOT NULL,
    city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    logo_url TEXT,
    cover_image_url TEXT,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    opening_time TIME,
    closing_time TIME,
    delivery_available BOOLEAN DEFAULT true,
    minimum_order DECIMAL(10, 2) DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant Images Table (Multiple images per restaurant)
CREATE TABLE restaurant_images (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100), -- Item category (e.g., "Main Course", "Side Dish", "Drinks")
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER, -- in minutes
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table (Customer reviews for restaurants and menu items)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false, -- Verified purchase
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, restaurant_id, menu_item_id) -- One review per user per item/restaurant
);

-- Indexes for better query performance
CREATE INDEX idx_restaurants_city ON restaurants(city_id);
CREATE INDEX idx_restaurants_category ON restaurants(category_id);
CREATE INDEX idx_restaurants_active ON restaurants(is_active);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_reviews_menu_item ON reviews(menu_item_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_cities_country ON cities(country);
CREATE INDEX idx_cities_active ON cities(is_active);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Nigerian Cuisine', 'Traditional and authentic Nigerian dishes'),
('Fast Food', 'Quick service restaurants and fast food'),
('Chinese', 'Chinese and Asian cuisine'),
('Continental', 'Western and continental dishes'),
('Bakery & Pastries', 'Baked goods, cakes, and pastries'),
('Seafood', 'Fresh fish and seafood specialties'),
('Vegetarian', 'Plant-based and vegetarian options'),
('Grills & BBQ', 'Grilled meats and barbecue');

-- Insert sample cities (Nigeria and other countries)
INSERT INTO cities (city, state, country, latitude, longitude) VALUES
-- Nigeria - Lagos State
('Lagos', 'Lagos', 'Nigeria', 6.5244, 3.3792),
('Ikeja', 'Lagos', 'Nigeria', 6.6018, 3.3515),
('Lekki', 'Lagos', 'Nigeria', 6.4698, 3.5852),
('Surulere', 'Lagos', 'Nigeria', 6.4874, 3.3586),
('Yaba', 'Lagos', 'Nigeria', 6.5101, 3.3869),

-- Nigeria - Oyo State
('Ibadan', 'Oyo', 'Nigeria', 7.3775, 3.9470),
('Ogbomoso', 'Oyo', 'Nigeria', 8.1337, 4.2407),
('Oyo', 'Oyo', 'Nigeria', 7.8526, 3.9310),

-- Nigeria - Abuja (FCT)
('Abuja', 'Federal Capital Territory', 'Nigeria', 9.0765, 7.3986),
('Garki', 'Federal Capital Territory', 'Nigeria', 9.0320, 7.4830),
('Wuse', 'Federal Capital Territory', 'Nigeria', 9.0667, 7.4667),

-- Nigeria - Kano State
('Kano', 'Kano', 'Nigeria', 12.0022, 8.5920),

-- Nigeria - Kaduna State
('Kaduna', 'Kaduna', 'Nigeria', 10.5105, 7.4165),

-- Other countries for international expansion
('London', 'England', 'United Kingdom', 51.5074, -0.1278),
('New York', 'New York', 'United States', 40.7128, -74.0060),
('Dubai', 'Dubai', 'United Arab Emirates', 25.2048, 55.2708),
('Johannesburg', 'Gauteng', 'South Africa', -26.2041, 28.0473);

-- Insert Mr. Cook restaurant as sample data
INSERT INTO restaurants (
    name, description, phone, whatsapp, address, city_id,
    latitude, longitude, category_id, rating, total_reviews,
    opening_time, closing_time, delivery_available, delivery_fee
) VALUES (
    'Mr. Cook',
    'Experience the rich flavors of Nigeria, delivered fresh to your door. We specialize in authentic Nigerian cuisine made with love and served with passion.',
    '07061699248',
    '2347061699248',
    'Lagos - Ojoo Expy, FW97+7H',
    (SELECT id FROM cities WHERE city = 'Ibadan' AND state = 'Oyo' LIMIT 1),
    7.4328,
    3.9142,
    1, -- Nigerian Cuisine category
    4.7,
    3,
    '08:00:00',
    '22:00:00',
    true,
    500.00
);

-- Get the restaurant ID for menu items
DO $$
DECLARE
    mr_cook_id INTEGER;
BEGIN
    SELECT id INTO mr_cook_id FROM restaurants WHERE name = 'Mr. Cook';
    
    -- Insert menu items for Mr. Cook
    INSERT INTO menu_items (restaurant_id, name, description, price, category, preparation_time) VALUES
    (mr_cook_id, 'Jollof Rice', 'Our signature West African party rice, cooked in a rich tomato sauce with aromatic spices', 1500.00, 'Main Course', 30),
    (mr_cook_id, 'Fried Rice', 'Colorful Nigerian-style fried rice with mixed vegetables and savory seasonings', 1500.00, 'Main Course', 25),
    (mr_cook_id, 'Grilled Chicken', 'Perfectly seasoned and grilled chicken with our special spicy marinade', 2500.00, 'Protein', 40),
    (mr_cook_id, 'Grilled Fish', 'Fresh fish marinated in traditional Nigerian spices and grilled to perfection', 3000.00, 'Protein', 35),
    (mr_cook_id, 'Dodo (Fried Plantain)', 'Sweet ripe plantains fried to golden perfection - the perfect side dish', 800.00, 'Side Dish', 15);
    
    -- Insert restaurant images
    INSERT INTO restaurant_images (restaurant_id, image_url, is_primary) VALUES
    (mr_cook_id, '/uploads/jollof_rice.jpg', true),
    (mr_cook_id, '/uploads/fried_rice.jpg', false),
    (mr_cook_id, '/uploads/grilled_chicken.jpg', false),
    (mr_cook_id, '/uploads/grilled_fish.jpg', false),
    (mr_cook_id, '/uploads/plantain_dodo.jpg', false);
END $$;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample queries for testing

-- Get all restaurants with their categories
-- SELECT r.*, c.name as category_name FROM restaurants r
-- LEFT JOIN categories c ON r.category_id = c.id
-- WHERE r.is_active = true;

-- Get restaurant with menu items
-- SELECT r.name as restaurant_name, m.* FROM menu_items m
-- JOIN restaurants r ON m.restaurant_id = r.id
-- WHERE r.id = 1 AND m.is_available = true;

-- Search restaurants by city
-- SELECT * FROM restaurants WHERE city ILIKE '%Ibadan%' AND is_active = true; 