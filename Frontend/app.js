// app.js - FIXED & OPTIMIZED Frontend JavaScript

const API_BASE_URL = 'http://localhost:5001/api';

// Nigerian States - EXACTLY 16 POPULAR STATES
const NIGERIAN_STATES = [
    // Eastern States (8)
    { state: 'Enugu', city: 'Enugu' },
    { state: 'Imo', city: 'Owerri' },
    { state: 'Abia', city: 'Umuahia' },
    { state: 'Anambra', city: 'Awka' },
    { state: 'Anambra', city: 'Onitsha' },
    { state: 'Ebonyi', city: 'Abakaliki' },
    { state: 'Cross River', city: 'Calabar' },
    { state: 'Akwa Ibom', city: 'Uyo' },
    // Other Major States (8)
    { state: 'Lagos', city: 'Lagos' },
    { state: 'Oyo', city: 'Ibadan' },
    { state: 'Federal Capital Territory', city: 'Abuja' },
    { state: 'Rivers', city: 'Port Harcourt' },
    { state: 'Kano', city: 'Kano' },
    { state: 'Kaduna', city: 'Kaduna' },
    { state: 'Edo', city: 'Benin City' },
    { state: 'Delta', city: 'Warri' }
];

// State
let restaurants = [];
let categories = [];
let currentRestaurant = null;
let cart = [];
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    showLoading(true);
    try {
        await Promise.all([
            loadCategories(),
            loadRestaurants()
        ]);
        populateStateDropdowns();
        setupEventListeners();
        checkAuth();
    } catch (error) {
        console.error('Init error:', error);
        showError('Failed to load. Please refresh.');
    } finally {
        showLoading(false);
    }
}

function setupEventListeners() {
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchRestaurants();
    });
}

// === API CALLS ===

async function loadRestaurants(params = {}) {
    try {
        const query = new URLSearchParams(params);
        const response = await fetch(`${API_BASE_URL}/restaurants?${query}`);
        const data = await response.json();
        
        if (data.success) {
            restaurants = data.data;
            renderRestaurants(restaurants);
            updateRestaurantCount(data.count);
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        if (data.success) {
            categories = data.data;
            populateCategoryFilters();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadRestaurantDetails(restaurantId) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`);
        const data = await response.json();
        
        if (data.success) {
            currentRestaurant = data.data;
            showRestaurantModal(data.data);
        }
    } catch (error) {
        console.error('Error loading restaurant:', error);
        showError('Failed to load restaurant');
    } finally {
        showLoading(false);
    }
}

async function searchRestaurants() {
    const searchQuery = document.getElementById('searchInput').value.trim();
    const cityFilter = document.getElementById('cityFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    if (!searchQuery && !cityFilter && !categoryFilter) {
        loadRestaurants();
        return;
    }
    
    try {
        showLoading(true);
        const params = {
            ...(searchQuery && { q: searchQuery }),
            ...(cityFilter && { city: cityFilter }),
            ...(categoryFilter && { category: categoryFilter })
        };
        
        const query = new URLSearchParams(params);
        const response = await fetch(`${API_BASE_URL}/search?${query}`);
        const data = await response.json();
        
        if (data.success) {
            const results = data.data.restaurants.items || [];
            renderRestaurants(results);
            updateRestaurantCount(data.data.restaurants.count);
            document.getElementById('sectionTitle').textContent = 
                searchQuery ? `Results for "${searchQuery}"` : 'Search Results';
        }
    } catch (error) {
        console.error('Search error:', error);
    } finally {
        showLoading(false);
    }
}

// REPLACE the registerRestaurant function (around line 100-140)
async function registerRestaurant(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const restaurantData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        whatsapp: formData.get('whatsapp') || formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        category_id: formData.get('category_id') || null,
        description: formData.get('description'),
        delivery_available: true
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(restaurantData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 🔥 KEY FIX: Store restaurant ID
            localStorage.setItem('restaurant_id', data.data.id);
            localStorage.setItem('restaurant_name', data.data.name);
            
            alert('✅ Restaurant registered successfully!\n\nRedirecting to dashboard...');
            closeRegisterModal();
            
            // 🔥 KEY FIX: Redirect to dashboard with ID
            window.location.href = `/restaurant-dashboard?restaurant_id=${data.data.id}`;
        } else {
            const errorMsg = data.errors ? data.errors.map(e => e.msg).join('\n') : data.error;
            alert('❌ Registration failed:\n' + errorMsg);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Failed to register. Please try again.');
    }
}


// === RENDER FUNCTIONS ===

function renderRestaurants(restaurantList) {
    const grid = document.getElementById('restaurantGrid');
    
    if (!restaurantList || restaurantList.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #888;">
                <p style="font-size: 3rem;">🔍</p>
                <p style="font-size: 1.5rem;">No restaurants found</p>
                <p>Try different search terms or filters</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = restaurantList.map(restaurant => {
        const images = Array.isArray(restaurant.images) ? restaurant.images : [];
        const primaryImage = images.find(img => img.is_primary) || images[0];
        const imageUrl = primaryImage ? primaryImage.image_url : '';
        const rating = restaurant.rating ? parseFloat(restaurant.rating) : 4.5;
        
        return `
            <div class="restaurant-card" onclick="loadRestaurantDetails(${restaurant.id})">
                ${imageUrl ? `
                    <img src="${imageUrl}" alt="${restaurant.name}" class="restaurant-image" 
                         onerror="this.style.display='none'">
                ` : `
                    <div class="restaurant-image" style="background: linear-gradient(135deg, #ff6b35, #ffa500); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                        🍽️
                    </div>
                `}
                <div class="restaurant-info">
                    <div class="restaurant-header">
                        <div>
                            <div class="restaurant-name">${restaurant.name}</div>
                            <div class="restaurant-category">${restaurant.category_name || 'Restaurant'}</div>
                        </div>
                        <div class="restaurant-rating">⭐ ${rating.toFixed(1)}</div>
                    </div>
                    ${restaurant.description ? `
                        <div class="restaurant-description">${restaurant.description}</div>
                    ` : ''}
                    <div class="restaurant-details">
                        <div class="detail-item">📍 ${restaurant.city}, ${restaurant.state}</div>
                        ${restaurant.delivery_available ? '<div class="detail-item">🚗 Delivery</div>' : ''}
                    </div>
                    <button class="view-menu-btn" onclick="event.stopPropagation(); loadRestaurantDetails(${restaurant.id})">
                        View Menu & Order
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showRestaurantModal(restaurant) {
    const modal = document.getElementById('restaurantModal');
    const detailsContainer = document.getElementById('restaurantDetails');
    
    const menuItems = Array.isArray(restaurant.menu_items) ? restaurant.menu_items : [];
    const rating = restaurant.rating ? parseFloat(restaurant.rating) : 4.5;
    
    detailsContainer.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="font-size: 2.5rem; color: var(--secondary-color); margin-bottom: 0.5rem;">
                ${restaurant.name}
            </h2>
            <p style="color: var(--text-muted); margin-bottom: 1rem;">
                ${restaurant.category_name || 'Restaurant'} • ${restaurant.city}, ${restaurant.state}
            </p>
            ${restaurant.description ? `
                <p style="color: #ddd; line-height: 1.6; margin-bottom: 1rem;">${restaurant.description}</p>
            ` : ''}
            <div style="display: flex; gap: 2rem; flex-wrap: wrap; color: var(--text-muted); margin-bottom: 1rem;">
                <div>⭐ ${rating.toFixed(1)} (${restaurant.total_reviews} reviews)</div>
                <div>📞 ${restaurant.phone}</div>
                ${restaurant.delivery_available ? `<div>🚗 Delivery: ₦${parseFloat(restaurant.delivery_fee || 0).toFixed(0)}</div>` : ''}
            </div>
            <div style="color: var(--text-muted);">📍 ${restaurant.address}</div>
        </div>
        
        <h3 style="font-size: 2rem; color: var(--secondary-color); margin-bottom: 1.5rem;">Menu</h3>
        
        ${menuItems.length > 0 ? `
            <div class="menu-grid">
                ${menuItems.map(item => `
                    <div class="menu-item">
                        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="menu-item-image" onerror="this.style.display='none'">` : ''}
                        <div class="menu-item-details">
                            <div class="menu-item-name">${item.name}</div>
                            ${item.description ? `<div class="menu-item-description">${item.description}</div>` : ''}
                            <div class="menu-item-footer">
                                <div class="menu-item-price">₦${parseFloat(item.price).toLocaleString()}</div>
                                <button class="add-to-cart" onclick="addToCart(${restaurant.id}, ${item.id})">Add +</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div style="text-align: center; padding: 3rem; color: #888;">
                <p>No menu items available yet</p>
            </div>
        `}
    `;
    
    modal.classList.add('active');
}

function closeRestaurantModal() {
    document.getElementById('restaurantModal').classList.remove('active');
}

// === POPULATE DROPDOWNS ===

function populateStateDropdowns() {
    // Get unique states
    const uniqueStates = [...new Set(NIGERIAN_STATES.map(item => item.state))].sort();
    
    // City filter (main page)
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        cityFilter.innerHTML = '<option value="">All States</option>' +
            uniqueStates.map(state => `<option value="${state}">${state}</option>`).join('');
    }
    
    // Registration state select
    const registerStateSelect = document.getElementById('registerStateSelect');
    if (registerStateSelect) {
        registerStateSelect.innerHTML = '<option value="">Select State</option>' +
            uniqueStates.map(state => `<option value="${state}">${state}</option>`).join('');
        
        registerStateSelect.addEventListener('change', (e) => {
            populateCitiesForState(e.target.value);
        });
    }
}

function populateCitiesForState(selectedState) {
    const citySelect = document.getElementById('registerCitySelect');
    if (!citySelect) return;
    
    const cities = NIGERIAN_STATES
        .filter(item => item.state === selectedState)
        .map(item => item.city);
    
    citySelect.innerHTML = '<option value="">Select City</option>' +
        cities.map(city => `<option value="${city}">${city}</option>`).join('');
}

function populateCategoryFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categorySelect = document.getElementById('categorySelect');
    
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
    }
    
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select Category</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
}

function applyFilters() {
    const city = document.getElementById('cityFilter').value;
    const category = document.getElementById('categoryFilter').value;
    
    const params = {};
    if (city) params.state = city; // Using state filter
    if (category) params.category = category;
    
    loadRestaurants(params);
}

// === CART FUNCTIONS ===

function addToCart(restaurantId, itemId) {
    if (!currentRestaurant) return;
    
    if (cart.length > 0 && cart[0].restaurant_id !== restaurantId) {
        if (!confirm('Clear cart from another restaurant and add this item?')) return;
        cart = [];
    }
    
    const menuItem = currentRestaurant.menu_items.find(item => item.id === itemId);
    if (!menuItem) return;
    
    const existingItem = cart.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...menuItem,
            restaurant_id: restaurantId,
            restaurant_name: currentRestaurant.name,
            restaurant_phone: currentRestaurant.phone,
            restaurant_whatsapp: currentRestaurant.whatsapp,
            delivery_fee: currentRestaurant.delivery_fee || 0,
            quantity: 1
        });
    }
    
    updateCart();
    event.target.textContent = 'Added! ✓';
    setTimeout(() => { event.target.textContent = 'Add +'; }, 1000);
}

function updateCart() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartRestaurantInfo = document.getElementById('cartRestaurantInfo');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p style="font-size: 3rem;">🛒</p>
                <p>Your cart is empty</p>
            </div>
        `;
        cartRestaurantInfo.innerHTML = '';
        cartTotal.style.display = 'none';
        checkoutBtn.style.display = 'none';
    } else {
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        const deliveryFee = cart[0].delivery_fee || 0;
        const total = subtotal + deliveryFee;
        
        cartRestaurantInfo.innerHTML = `<strong>${cart[0].restaurant_name}</strong><br>📞 ${cart[0].restaurant_phone}`;
        
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="cart-item-image" onerror="this.style.display='none'">` : ''}
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₦${(parseFloat(item.price) * item.quantity).toLocaleString()}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('subtotalAmount').textContent = `₦${subtotal.toLocaleString()}`;
        
        if (deliveryFee > 0) {
            document.getElementById('deliveryFeeRow').style.display = 'flex';
            document.getElementById('deliveryFeeAmount').textContent = `₦${deliveryFee.toLocaleString()}`;
        }
        
        document.getElementById('totalAmount').textContent = `₦${total.toLocaleString()}`;
        cartTotal.style.display = 'block';
        checkoutBtn.style.display = 'block';
    }
}

function updateQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        updateCart();
    }
}

function toggleCart() {
    document.getElementById('cartModal').classList.toggle('active');
}

function checkout() {
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const deliveryFee = cart[0].delivery_fee || 0;
    const total = subtotal + deliveryFee;
    
    const orderDetails = cart.map(item => 
        `${item.name} x${item.quantity} - ₦${(parseFloat(item.price) * item.quantity).toLocaleString()}`
    ).join('\n');
    
    const message = `Hello ${cart[0].restaurant_name}! 🍽️\n\nI'd like to order:\n\n${orderDetails}\n\nSubtotal: ₦${subtotal.toLocaleString()}\nDelivery: ₦${deliveryFee.toLocaleString()}\nTotal: ₦${total.toLocaleString()}\n\nPlease confirm!`;
    
    const whatsappNumber = cart[0].restaurant_whatsapp || cart[0].restaurant_phone;
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
}

// === AUTH FUNCTIONS ===

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token with backend
        fetch(`${API_BASE_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentUser = data.user;
                updateAuthUI();
            } else {
                localStorage.removeItem('token');
            }
        })
        .catch(() => localStorage.removeItem('token'));
    }
}

function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    if (currentUser && authButtons) {
        authButtons.innerHTML = `<span style="color: var(--secondary-color);">Hello, ${currentUser.name}!</span>`;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeLoginModal();
            alert('Welcome back!');
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    if (formData.get('password') !== formData.get('confirmPassword')) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateAuthUI();
            closeSignupModal();
            alert('Account created successfully!');
        } else {
            alert('Signup failed: ' + data.error);
        }
    } catch (error) {
        alert('Signup failed. Please try again.');
    }
}

// === MODAL FUNCTIONS ===

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showSignupModal() {
    document.getElementById('signupModal').style.display = 'flex';
}

function closeSignupModal() {
    document.getElementById('signupModal').style.display = 'none';
}

function switchToSignup(e) {
    e.preventDefault();
    closeLoginModal();
    showSignupModal();
}

function switchToLogin(e) {
    e.preventDefault();
    closeSignupModal();
    showLoginModal();
}

function accessDashboard() {
    window.location.href = '/restaurant-dashboard';
}

// === UTILITY FUNCTIONS ===

function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.style.display = show ? 'block' : 'none';
}

function updateRestaurantCount(count) {
    const countEl = document.getElementById('restaurantCount');
    if (countEl) countEl.textContent = `${count} restaurant${count !== 1 ? 's' : ''} found`;
}

function showError(message) {
    alert(message);
}

// Close modals on outside click
window.onclick = function(event) {
    const modals = ['restaurantModal', 'cartModal', 'registerModal', 'loginModal', 'signupModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    });
}


// ADD THESE FUNCTIONS TO YOUR app.js
// Restaurant Owner Authentication & Dashboard Access

// ===== RESTAURANT OWNER LOGIN MODAL =====

function showRestaurantLoginModal() {
    document.getElementById('restaurantLoginModal').style.display = 'flex';
}

function closeRestaurantLoginModal() {
    document.getElementById('restaurantLoginModal').style.display = 'none';
}

async function handleRestaurantLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store auth token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            
            // Load user's restaurants
            const restaurants = await loadMyRestaurants();
            
            if (restaurants.length === 0) {
                alert('✅ Login successful!\n\nYou don\'t have any restaurants yet. Please register one first.');
                closeRestaurantLoginModal();
                showRegisterModal();
            } else if (restaurants.length === 1) {
                // Only one restaurant - go directly to dashboard
                localStorage.setItem('restaurant_id', restaurants[0].id);
                localStorage.setItem('restaurant_name', restaurants[0].name);
                alert(`✅ Welcome back, ${data.user.name}!`);
                closeRestaurantLoginModal();
                window.location.href = `/restaurant-dashboard?restaurant_id=${restaurants[0].id}`;
            } else {
                // Multiple restaurants - show selection
                showRestaurantSelector(restaurants);
                closeRestaurantLoginModal();
            }
        } else {
            alert('❌ Login failed: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('❌ Login failed. Please check your connection and try again.');
    }
}

async function loadMyRestaurants() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/restaurants/my-restaurants`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
        return [];
    }
}

function showRestaurantSelector(restaurants) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.style.display = 'flex';
    modal.id = 'restaurantSelectorModal';
    
    modal.innerHTML = `
        <div class="auth-content">
            <div class="auth-header">
                <h2>Select Your Restaurant</h2>
                <button class="close-modal" onclick="closeRestaurantSelector()">×</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${restaurants.map(restaurant => `
                    <button 
                        onclick="selectRestaurant(${restaurant.id}, '${restaurant.name}')" 
                        class="submit-btn"
                        style="text-align: left; padding: 1.5rem; background: rgba(255, 107, 53, 0.1); border: 2px solid var(--primary-color);"
                    >
                        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${restaurant.name}
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">
                            📍 ${restaurant.city}, ${restaurant.state}
                        </div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeRestaurantSelector() {
    const modal = document.getElementById('restaurantSelectorModal');
    if (modal) {
        modal.remove();
    }
}

function selectRestaurant(restaurantId, restaurantName) {
    localStorage.setItem('restaurant_id', restaurantId);
    localStorage.setItem('restaurant_name', restaurantName);
    closeRestaurantSelector();
    window.location.href = `/restaurant-dashboard?restaurant_id=${restaurantId}`;
}

// ===== UPDATE REGISTER RESTAURANT TO INCLUDE OWNER =====

async function registerRestaurant(event) {
    event.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        alert('⚠️ Please login first before registering a restaurant!');
        closeRegisterModal();
        showRestaurantLoginModal();
        return;
    }
    
    const formData = new FormData(event.target);
    const restaurantData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        whatsapp: formData.get('whatsapp') || formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        category_id: formData.get('category_id') || null,
        description: formData.get('description'),
        delivery_available: true
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Add auth token
            },
            body: JSON.stringify(restaurantData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store restaurant ID
            localStorage.setItem('restaurant_id', data.data.id);
            localStorage.setItem('restaurant_name', data.data.name);
            
            alert('✅ Restaurant registered successfully!\n\nRedirecting to dashboard to add menu items...');
            closeRegisterModal();
            
            // Redirect to dashboard
            window.location.href = `/restaurant-dashboard?restaurant_id=${data.data.id}`;
        } else {
            if (response.status === 401) {
                alert('⚠️ Please login first!');
                closeRegisterModal();
                showRestaurantLoginModal();
            } else {
                const errorMsg = data.errors ? data.errors.map(e => e.msg).join('\n') : data.error;
                alert('❌ Registration failed:\n' + errorMsg);
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Failed to register. Please try again.');
    }
}

// ===== UPDATE ACCESS DASHBOARD FUNCTION =====

async function accessDashboard() {
    const token = localStorage.getItem('token');
    
    // Check if user is logged in
    if (!token) {
        alert('⚠️ Please login to access your restaurant dashboard!');
        showRestaurantLoginModal();
        return;
    }
    
    // Load user's restaurants
    const restaurants = await loadMyRestaurants();
    
    if (restaurants.length === 0) {
        alert('You don\'t have any restaurants yet.\n\nPlease register your restaurant first!');
        showRegisterModal();
    } else if (restaurants.length === 1) {
        // Go directly to dashboard
        localStorage.setItem('restaurant_id', restaurants[0].id);
        localStorage.setItem('restaurant_name', restaurants[0].name);
        window.location.href = `/restaurant-dashboard?restaurant_id=${restaurants[0].id}`;
    } else {
        // Show restaurant selector
        showRestaurantSelector(restaurants);
    }
}

// ===== UPDATE SHOW REGISTER MODAL =====

function showRegisterModal() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('⚠️ Please login first before registering a restaurant!');
        showRestaurantLoginModal();
        return;
    }
    
    document.getElementById('registerModal').style.display = 'flex';
}