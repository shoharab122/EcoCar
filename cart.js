let cart = { items: [], total: 0, itemCount: 0 };
let currentUser = null;

const cartContainer = document.getElementById('cart-container');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const cartCount = document.getElementById('cart-count');

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
});

function setupEventListeners() {
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', placeOrder);
}

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        if (data.loggedIn) {
            currentUser = data.user;
            userInfo.innerHTML = `<i class="fas fa-user"></i> Hello, ${currentUser.username}`;
            logoutBtn.style.display = 'flex';
            renderAvatar(currentUser.avatar);
            loadCart();
        } else {
            // Not logged in – redirect to products page (which shows login form)
            window.location.href = '/apps.html';
        }
    } catch (error) {
        console.error(error);
    }
}

function renderAvatar(avatarId) {
    const avatarDiv = document.getElementById('user-avatar');
    if (avatarDiv) {
        // Simplified avatar – you can copy the full avatar logic from apps.js if desired
        avatarDiv.innerHTML = `<i class="fas fa-user-circle" style="color: #43a047; font-size: 2rem;"></i>`;
        avatarDiv.style.display = 'flex';
    }
}

async function loadCart() {
    if (!currentUser) return;
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
        cartContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="apps.html" class="btn-primary" style="display: inline-block; margin-top: 1rem;">Continue Shopping</a>
            </div>`;
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
            <div>
                <span class="cart-total">Total: ৳${cart.total}</span>
                <button class="btn-clear-cart" onclick="clearCart()">Clear Cart</button>
            </div>
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
        loadCart(); // reload cart (will be empty)
    } catch (error) {
        showToast(error.message, 'error');
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

async function handleLogout() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        window.location.href = '/apps.html';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}