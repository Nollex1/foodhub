// restaurant-dashboard.js - FIXED VERSION

const API_BASE_URL = 'http://localhost:5001/api';

// State
let currentRestaurant = null;
let menuItems = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    const restaurantId = getRestaurantId();

    if (!restaurantId) {
        alert('⚠️ No restaurant found!\n\nPlease register your restaurant first.');
        window.location.href = '/';
        return;
    }

    try {
        await loadRestaurantDetails(restaurantId);
        await loadMenuItems(restaurantId);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        alert('Failed to load restaurant data. Please try again.');
    }
}

function getRestaurantId() {
    // Try URL params first
    const urlParams = new URLSearchParams(window.location.search);
    let restaurantId = urlParams.get('restaurant_id');
    
    // If not in URL, try localStorage
    if (!restaurantId) {
        restaurantId = localStorage.getItem('restaurant_id');
    }
    
    // Store in localStorage for future use
    if (restaurantId) {
        localStorage.setItem('restaurant_id', restaurantId);
    }
    
    return restaurantId;
}

async function loadRestaurantDetails(restaurantId) {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`);
        const data = await response.json();

        if (data.success) {
            currentRestaurant = data.data;
            document.getElementById('restaurantName').textContent = currentRestaurant.name;
            
            // Update page title
            document.title = `${currentRestaurant.name} - Dashboard`;
        } else {
            throw new Error('Restaurant not found');
        }
    } catch (error) {
        console.error('Error loading restaurant details:', error);
        alert('Failed to load restaurant. Redirecting to home...');
        window.location.href = '/';
    }
}

async function loadMenuItems(restaurantId) {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/restaurant/${restaurantId}`);
        const data = await response.json();

        if (data.success) {
            menuItems = data.data || [];
            renderMenuItems();
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        menuItems = [];
        renderMenuItems();
    }
}

function renderMenuItems() {
    const menuGrid = document.getElementById('menuGrid');

    if (menuItems.length === 0) {
        menuGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <p style="font-size: 4rem; margin-bottom: 1rem;">🍽️</p>
                <h3 style="color: var(--secondary-color); margin-bottom: 0.5rem;">No menu items yet</h3>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Start building your menu by adding your first dish!</p>
                <button onclick="showAddMenuModal()" class="add-btn" style="margin: 0 auto;">+ Add First Menu Item</button>
            </div>
        `;
        return;
    }

    menuGrid.innerHTML = menuItems.map(item => {
        const price = parseFloat(item.price || 0);
        return `
            <div class="menu-card" style="background: rgba(255, 255, 255, 0.05); border-radius: 15px; overflow: hidden; border: 2px solid transparent; transition: all 0.3s;">
                ${item.image_url ? `
                    <img src="${item.image_url}" alt="${item.name}" class="menu-image" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.style.display='none'">
                ` : `
                    <div class="menu-image-placeholder" style="width: 100%; height: 200px; background: linear-gradient(135deg, #ff6b35, #ffa500); display: flex; align-items: center; justify-content: center; font-size: 4rem;">
                        🍽️
                    </div>
                `}
                <div class="menu-details" style="padding: 1.5rem;">
                    <div class="menu-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <h3 style="color: var(--secondary-color); font-size: 1.3rem; margin: 0;">${item.name}</h3>
                        <div class="menu-actions" style="display: flex; gap: 0.5rem;">
                            <button onclick="editMenuItem(${item.id})" class="edit-btn" style="background: rgba(255, 165, 0, 0.2); border: 1px solid var(--secondary-color); color: var(--secondary-color); padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer;">✏️ Edit</button>
                            <button onclick="deleteMenuItem(${item.id})" class="delete-btn" style="background: rgba(255, 0, 0, 0.2); border: 1px solid #ff4444; color: #ff4444; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer;">🗑️</button>
                        </div>
                    </div>
                    ${item.description ? `<p class="menu-description" style="color: #ddd; margin-bottom: 1rem; font-size: 0.9rem;">${item.description}</p>` : ''}
                    <div class="menu-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <span class="menu-price" style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">₦${price.toLocaleString()}</span>
                        ${item.category ? `<span class="menu-category" style="background: rgba(255, 165, 0, 0.2); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem;">${item.category}</span>` : ''}
                        <span class="menu-status ${item.is_available ? 'available' : 'unavailable'}" style="padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; ${item.is_available ? 'background: rgba(76, 175, 80, 0.2); color: #4caf50;' : 'background: rgba(255, 68, 68, 0.2); color: #ff4444;'}">
                            ${item.is_available ? '✅ Available' : '❌ Unavailable'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAddMenuModal() {
    document.getElementById('modalTitle').textContent = 'Add Menu Item';
    const form = document.getElementById('menuForm');
    form.reset();
    document.getElementById('menuItemId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('menuModal').style.display = 'flex';
}

function editMenuItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuItemId').value = item.id;
    document.querySelector('[name="name"]').value = item.name;
    document.querySelector('[name="description"]').value = item.description || '';
    document.querySelector('[name="price"]').value = item.price;
    document.querySelector('[name="category"]').value = item.category || 'Main Course';
    document.querySelector('[name="preparation_time"]').value = item.preparation_time || '';
    document.querySelector('[name="is_available"]').checked = item.is_available !== false;

    if (item.image_url) {
        document.getElementById('previewImg').src = item.image_url;
        document.getElementById('imagePreview').style.display = 'block';
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }

    document.getElementById('menuModal').style.display = 'flex';
}

function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function saveMenuItem(event) {
    event.preventDefault();

    if (!currentRestaurant) {
        alert('Restaurant not loaded. Please refresh the page.');
        return;
    }

    const formData = new FormData(event.target);
    
    const menuItemData = {
        restaurant_id: currentRestaurant.id,
        name: formData.get('name'),
        description: formData.get('description') || '',
        price: parseFloat(formData.get('price')),
        category: formData.get('category') || 'Main Course',
        preparation_time: formData.get('preparation_time') ? parseInt(formData.get('preparation_time')) : null,
        is_available: formData.get('is_available') === 'on'
    };

    // Handle image upload
    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
        try {
            const imageUrl = await uploadImage(imageFile);
            if (imageUrl) {
                menuItemData.image_url = imageUrl;
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            // Continue without image
        }
    }

    const itemId = formData.get('id');
    const isEdit = !!itemId;

    try {
        const url = isEdit ? `${API_BASE_URL}/menu/${itemId}` : `${API_BASE_URL}/menu`;
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(menuItemData)
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Menu item ${isEdit ? 'updated' : 'added'} successfully!`);
            closeMenuModal();
            await loadMenuItems(currentRestaurant.id);
        } else {
            const errorMsg = data.errors ? data.errors.map(e => e.msg).join('\n') : data.error;
            alert('❌ Failed to save menu item:\n' + errorMsg);
        }
    } catch (error) {
        console.error('Error saving menu item:', error);
        alert('❌ Failed to save menu item. Please check your connection and try again.');
    }
}

async function uploadImage(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/uploads/menu-image`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.image_url;
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function deleteMenuItem(itemId) {
    if (!confirm('⚠️ Are you sure you want to delete this menu item?\n\nThis action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Menu item deleted successfully!');
            await loadMenuItems(currentRestaurant.id);
        } else {
            alert('❌ Failed to delete menu item: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('❌ Failed to delete menu item. Please try again.');
    }
}

function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Show selected section
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('restaurant_id');
        localStorage.removeItem('restaurant_name');
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('menuModal');
    if (event.target === modal) {
        closeMenuModal();
    }
}