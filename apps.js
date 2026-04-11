let products = [];
let allProducts = []; // Store original products for search
let cart = { items: [], total: 0, itemCount: 0 };
let currentUser = null;

const productsContainer = document.getElementById('products-container');
const cartContainer = document.getElementById('cart-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const cartCount = document.getElementById('cart-count');
const authSection = document.getElementById('auth');
const productsSection = document.getElementById('products');
const cartSection = document.getElementById('cart');
const navLinks = document.getElementById('nav-links');

// Avatar list (10 icons)
const avatarList = [
    { icon: 'fas fa-user-circle', color: '#43a047' },
    { icon: 'fas fa-smile-wink', color: '#ffb74d' },
    { icon: 'fas fa-cat', color: '#f06292' },
    { icon: 'fas fa-dog', color: '#ba68c8' },
    { icon: 'fas fa-tree', color: '#66bb6a' },
    { icon: 'fas fa-heart', color: '#ef5350' },
    { icon: 'fas fa-star', color: '#ffca28' },
    { icon: 'fas fa-moon', color: '#5c6bc0' },
    { icon: 'fas fa-sun', color: '#ffa726' },
    { icon: 'fas fa-feather-alt', color: '#26a69a' }
];

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
});

function setupEventListeners() {
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', placeOrder);
    const changeBtn = document.getElementById('change-avatar-btn');
    if (changeBtn) changeBtn.addEventListener('click', openAvatarModal);
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) closeModal.addEventListener('click', closeAvatarModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('avatar-modal');
        if (e.target === modal) closeAvatarModal();
    });
    
    // Search event listeners
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Product modal close listeners
    const modalClose = document.querySelector('.product-modal-close');
    const productModal = document.getElementById('product-modal');
    if (modalClose) modalClose.addEventListener('click', closeProductModal);
    window.addEventListener('click', (e) => {
        if (e.target === productModal) closeProductModal();
    });
    const modalAddToCart = document.getElementById('modal-add-to-cart');
    const modalOrderNow = document.getElementById('modal-order-now');
    if (modalAddToCart) modalAddToCart.addEventListener('click', () => {
        if (currentModalProduct) {
            addToCart(currentModalProduct.id).then(() => closeProductModal());
        }
    });
    if (modalOrderNow) modalOrderNow.addEventListener('click', () => {
        if (currentModalProduct) {
            addToCart(currentModalProduct.id).then(() => {
                window.location.href = '/cart.html';
            });
        }
    });
}

function renderAvatar(avatarId) {
    const idx = parseInt(avatarId.replace('avatar','')) - 1;
    const avatar = avatarList[idx] || avatarList[0];
    const avatarDiv = document.getElementById('user-avatar');
    if (avatarDiv) {
        avatarDiv.innerHTML = `<i class="${avatar.icon}" style="color: ${avatar.color}; font-size: 2rem;"></i>`;
        avatarDiv.style.display = 'flex';
    }
}

function buildAvatarGrid(selectedAvatar) {
    const grid = document.getElementById('avatar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    avatarList.forEach((av, i) => {
        const id = `avatar${i+1}`;
        const div = document.createElement('div');
        div.className = 'avatar-option' + (selectedAvatar === id ? ' selected' : '');
        div.innerHTML = `<i class="${av.icon}" style="color: ${av.color}; font-size: 2.5rem;"></i>`;
        div.onclick = () => selectAvatar(id);
        grid.appendChild(div);
    });
}

async function selectAvatar(avatarId) {
    try {
        const response = await fetch('/api/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: avatarId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast('Avatar updated!', 'success');
        renderAvatar(avatarId);
        if (currentUser) currentUser.avatar = avatarId;
        closeAvatarModal();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function openAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    if (!modal) return;
    const currentAvatar = currentUser ? currentUser.avatar : 'avatar1';
    buildAvatarGrid(currentAvatar);
    modal.style.display = 'flex';
}
function closeAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.style.display = 'none';
}

function showApp() {
    if (authSection) authSection.style.display = 'none';
    if (productsSection) productsSection.style.display = 'block';
    if (cartSection) cartSection.style.display = 'block';
    if (navLinks) navLinks.style.display = 'flex';
    loadProducts();
    loadCart();
}
function hideApp() {
    if (authSection) authSection.style.display = 'block';
    if (productsSection) productsSection.style.display = 'none';
    if (cartSection) cartSection.style.display = 'none';
    if (navLinks) navLinks.style.display = 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        await checkLoginStatus();
        loginForm.reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}
async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const username = formData.get('username');
    const password = formData.get('password');
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        await checkLoginStatus();
        registerForm.reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}
async function handleLogout() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        await checkLoginStatus();
    } catch (error) {
        showToast(error.message, 'error');
    }
}
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        if (data.loggedIn) {
            currentUser = data.user;
            userInfo.innerHTML = `<i class="fas fa-user"></i> Hello, ${currentUser.username}`;
            logoutBtn.style.display = 'flex';
            document.getElementById('change-avatar-btn').style.display = 'inline-block';
            renderAvatar(currentUser.avatar || 'avatar1');
            showApp();
            
            // Add My Orders link for all logged-in users
            let myOrdersLink = document.querySelector('.nav-links a[href="/my-orders.html"]');
            if (!myOrdersLink) {
                myOrdersLink = document.createElement('a');
                myOrdersLink.href = '/my-orders.html';
                myOrdersLink.textContent = '📋 My Orders';
                myOrdersLink.style.marginLeft = '1rem';
                document.querySelector('.nav-links').appendChild(myOrdersLink);
            }
            
            // Add Admin link if user is admin
            if (currentUser.username === 'admin') {
                let adminLink = document.querySelector('.nav-links a[href="/admin.html"]');
                if (!adminLink) {
                    adminLink = document.createElement('a');
                    adminLink.href = '/admin.html';
                    adminLink.textContent = '📋 Admin';
                    adminLink.style.marginLeft = '1rem';
                    document.querySelector('.nav-links').appendChild(adminLink);
                }
            }
        } else {
            currentUser = null;
            userInfo.innerHTML = '';
            logoutBtn.style.display = 'none';
            document.getElementById('change-avatar-btn').style.display = 'none';
            document.getElementById('user-avatar').style.display = 'none';
            hideApp();
        }
    } catch (error) {
        showToast('Failed to check login status', 'error');
    }
}

// ========== SEARCH FUNCTIONALITY ==========
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error();
        allProducts = await response.json();
        products = [...allProducts];
        renderProducts();
    } catch (error) {
        productsContainer.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed to load products</p></div>';
    }
}

// Product modal logic
let currentModalProduct = null;

function openProductModal(product) {
    currentModalProduct = product;
    const modal = document.getElementById('product-modal');
    const modalImg = document.getElementById('modal-product-img');
    const modalName = document.getElementById('modal-product-name');
    const modalDesc = document.getElementById('modal-product-description');
    const modalPrice = document.getElementById('modal-product-price');
    if (modal && modalImg && modalName && modalDesc && modalPrice) {
        modalImg.src = product.image_url;
        modalName.innerText = product.name;
        modalDesc.innerText = product.description;
        modalPrice.innerText = `৳${product.price}`;
        modal.style.display = 'flex';
    }
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
    currentModalProduct = null;
}

function renderProducts() {
    if (!productsContainer) return;
    if (allProducts.length === 0) {
        productsContainer.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No products available</p></div>';
        return;
    }
    productsContainer.innerHTML = allProducts.map(product => `
        <div class="product-card fade-in" data-product-id="${product.id}">
            <img src="${product.image_url}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">৳${product.price}</div>
            <button class="add-to-cart-btn" data-id="${product.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
        </div>
    `).join('');

    // Attach click listeners for product cards and buttons
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) return;
            const productId = parseInt(card.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            if (product) openProductModal(product);
        });
    });
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.id);
            addToCart(productId);
        });
    });
}

function renderFilteredProducts(productsToRender) {
    if (!productsContainer) return;
    if (productsToRender.length === 0) return;
    
    productsContainer.innerHTML = productsToRender.map(product => `
        <div class="product-card fade-in" data-product-id="${product.id}">
            <img src="${product.image_url}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">৳${product.price}</div>
            <button class="add-to-cart-btn" data-id="${product.id}"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
        </div>
    `).join('');

    // Re-attach listeners for filtered products
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) return;
            const productId = parseInt(card.dataset.productId);
            const product = productsToRender.find(p => p.id === productId);
            if (product) openProductModal(product);
        });
    });
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.id);
            addToCart(productId);
        });
    });
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.trim().toLowerCase();
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (searchTerm === '') {
        showToast('Please enter a search term', 'info');
        return;
    }
    
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm)
    );
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No products found matching "${searchTerm}"</p>
                <button onclick="clearSearch()" class="btn-primary" style="margin-top: 1rem; width: auto;">Clear Search</button>
            </div>
        `;
    } else {
        renderFilteredProducts(filteredProducts);
        showToast(`Found ${filteredProducts.length} product(s)`, 'success');
    }
    
    if (clearBtn) clearBtn.style.display = 'inline-flex';
}

function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    renderProducts();
    showToast('Search cleared', 'info');
}

// ========== CART FUNCTIONS ==========
async function loadCart() {
    if (!currentUser) {
        cart = { items: [], total: 0, itemCount: 0 };
        updateCartCount();
        renderCart();
        return;
    }
    try {
        const response = await fetch('/api/cart');
        if (!response.ok) throw new Error();
        cart = await response.json();
        updateCartCount();
        renderCart();
    } catch (error) {
        showToast('Failed to load cart', 'error');
    }
}

function updateCartCount() {
    if (cartCount) {
        cartCount.textContent = cart.itemCount || 0;
        cartCount.style.display = cart.itemCount > 0 ? 'inline' : 'none';
    }
}

function renderCart() {
    if (!cartContainer) return;
    if (!cart.items || cart.items.length === 0) {
        cartContainer.innerHTML = `<div class="empty-state"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>`;
        document.getElementById('checkout-form-container').style.display = 'none';
        return;
    }
    cartContainer.innerHTML = `
        <div class="cart-items">
            ${cart.items.map(item => `
                <div class="cart-item">
                    <img src="${item.image_url}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>৳${item.price} each</p>
                    </div>
                    <div class="cart-item-actions">
                        <input type="number" min="1" value="${item.quantity}" onchange="updateCartItem(${item.id}, this.value)">
                        <button class="btn-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="item-subtotal">৳${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <div><span class="cart-total">Total: ৳${cart.total}</span>
            <button class="btn-clear-cart" onclick="clearCart()">Clear Cart</button></div>
            <button class="btn-checkout" onclick="showCheckoutForm()">Checkout</button>
        </div>
    `;
}

function showCheckoutForm() {
    if (!cart.items || cart.items.length === 0) return;
    document.getElementById('checkout-form-container').style.display = 'block';
    document.getElementById('checkout-form-container').scrollIntoView({ behavior: 'smooth' });
}

function hideCheckoutForm() {
    document.getElementById('checkout-form-container').style.display = 'none';
    document.getElementById('order-form').reset();
}

async function placeOrder(e) {
    e.preventDefault();
    const form = document.getElementById('order-form');
    const formData = new FormData(form);
    const orderData = {
        fullName: formData.get('fullName'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        items: cart.items,
        total: cart.total
    };
    try {
        const response = await fetch('/api/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        hideCheckoutForm();
        loadCart();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function addToCart(productId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        await loadCart(); // Ensure cart updates before returning
    } catch (error) {
        showToast(error.message, 'error');
        throw error; // Re-throw so modal's .then can know it failed
    }
}

async function updateCartItem(cartItemId, newQuantity) {
    if (newQuantity < 1) return;
    try {
        const response = await fetch(`/api/cart/update/${cartItemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: parseInt(newQuantity) })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        loadCart();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function removeFromCart(cartItemId) {
    if (!confirm('Remove this item?')) return;
    try {
        const response = await fetch(`/api/cart/remove/${cartItemId}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        loadCart();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function clearCart() {
    if (!confirm('Clear entire cart?')) return;
    try {
        const response = await fetch('/api/cart/clear', { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        showToast(data.message, 'success');
        loadCart();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function showTab(tabName) {
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tabName}-form`).classList.add('active');
}
