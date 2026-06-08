// ==========================================================================
// BazarMind - Application Logic
// ==========================================================================

let currentUser = null;
let inventoryData = [];
let dashboardStats = {};
let billingCart = []; // POS cart: Array of { id, name, category, quantity, price, unit }
let currentInventoryCategory = 'All';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('bazarmind_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showMainApp();
        fetchDashboardData();
        fetchInventory();
    } else {
        switchView('login');
    }

    // Set up Event Listeners
    setupEventListeners();
    setupSalesBillingListeners();
});

// --- API Fetch Wrapper (Injects Mobile Header) ---
async function fetchAPI(url, options = {}) {
    const storedUser = localStorage.getItem('bazarmind_user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    
    options.headers = options.headers || {};
    if (user && user.mobile) {
        options.headers['X-User-Mobile'] = user.mobile;
    }
    return fetch(url, options);
}

// --- View Navigation ---
function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Manage Main Content visibility
    if (viewId === 'login' || viewId === 'register') {
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById(`view-${viewId}`).classList.add('active');
    } else {
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById(`view-${viewId}`).classList.add('active');
        
        // Update Bottom Nav state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.target === viewId);
        });
    }
}

function showMainApp() {
    switchView('home');
    document.getElementById('shop-name-header').textContent = currentUser.shop_name;
    document.getElementById('user-greeting').textContent = `Namaste, ${currentUser.name.split(' ')[0]}! 👋`;
    
    // Populate profile
    document.getElementById('prof-name').textContent = currentUser.name;
    document.getElementById('prof-shopname').textContent = currentUser.shop_name;
    document.getElementById('prof-city').textContent = currentUser.city;
    document.getElementById('prof-type').textContent = currentUser.type;
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Bottom Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.target;
            switchView(target);
            if (target === 'dashboard') fetchDashboardData();
            if (target === 'cart') fetchInventory();
            if (target === 'sales') {
                fetchInventory().then(() => {
                    populateBillingProductDropdown();
                });
                fetchSalesSummary();
            }
        });
    });

    // Auth Forms
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Add Product Form
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);

    // Notifications Panel
    document.getElementById('btn-bell').addEventListener('click', toggleNotifications);
    document.getElementById('close-notifications').addEventListener('click', toggleNotifications);

    // Inventory Search & Filter
    document.getElementById('search-inventory').addEventListener('input', renderInventoryList);
    document.getElementById('filter-category').addEventListener('change', renderDashboardTable);
    
    // Inventory Section Tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentInventoryCategory = tab.dataset.category;
            renderInventoryList();
        });
    });
}

// --- Sales Billing & Analysis System Event Listeners ---
function setupSalesBillingListeners() {
    // Sub-navigation inside Sales tab
    document.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.dataset.subtarget;
            document.querySelectorAll('.sub-view').forEach(v => v.classList.add('hidden'));
            document.getElementById(`sub-view-${target}`).classList.remove('hidden');
            
            if (target === 'analysis') {
                fetchSalesSummary();
            } else if (target === 'billing') {
                populateBillingProductDropdown();
            }
        });
    });

    // Handle Product Selector Change
    const prodSelect = document.getElementById('bill-prod-select');
    const qtyInput = document.getElementById('bill-prod-qty');
    const detailsBox = document.getElementById('bill-item-details-box');
    
    function updateBillingDetailsBox() {
        const selectedId = parseInt(prodSelect.value);
        const product = inventoryData.find(p => p.id === selectedId);
        
        if (product) {
            detailsBox.classList.remove('hidden');
            document.getElementById('bill-available-stock').textContent = `${product.quantity} ${product.unit}`;
            document.getElementById('bill-unit-price').textContent = `₹${product.price}`;
            
            const qty = parseInt(qtyInput.value) || 0;
            document.getElementById('bill-est-subtotal').textContent = `₹${(product.price * qty).toFixed(2)}`;
            
            qtyInput.max = product.quantity;
        } else {
            detailsBox.classList.add('hidden');
        }
    }
    
    prodSelect.addEventListener('change', updateBillingDetailsBox);
    qtyInput.addEventListener('input', updateBillingDetailsBox);

    // Form submission (Add item to Bill)
    document.getElementById('billing-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedId = parseInt(prodSelect.value);
        const qty = parseInt(qtyInput.value);
        
        const product = inventoryData.find(p => p.id === selectedId);
        if (!product) return;
        
        if (qty <= 0) {
            alert('Please select a valid quantity.');
            return;
        }
        
        if (qty > product.quantity) {
            alert(`Cannot sell more than available stock (${product.quantity} ${product.unit}).`);
            return;
        }
        
        const existingCartItem = billingCart.find(item => item.id === selectedId);
        if (existingCartItem) {
            if (existingCartItem.quantity + qty > product.quantity) {
                alert(`Total billing quantity (${existingCartItem.quantity + qty}) exceeds available stock (${product.quantity} ${product.unit}).`);
                return;
            }
            existingCartItem.quantity += qty;
        } else {
            billingCart.push({
                id: product.id,
                name: product.name,
                category: product.category,
                quantity: qty,
                price: product.price,
                unit: product.unit
            });
        }
        
        // Reset inputs
        prodSelect.value = "";
        qtyInput.value = "1";
        detailsBox.classList.add('hidden');
        
        renderBillingCart();
    });

    // Complete Sale (Checkout)
    document.getElementById('btn-checkout').addEventListener('click', async () => {
        if (billingCart.length === 0) return;
        
        const payload = {
            items: billingCart.map(item => ({ id: item.id, quantity: item.quantity }))
        };
        
        try {
            const res = await fetchAPI('/api/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                alert('Sale completed successfully! Stock levels updated.');
                billingCart = [];
                renderBillingCart();
                
                // Refresh data
                inventoryData = result.inventory;
                populateBillingProductDropdown();
                fetchInventory();
                fetchDashboardData();
            } else {
                alert('Error completing sale: ' + result.message);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to complete transaction.');
        }
    });
}

// --- Authentication ---
async function handleRegister(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('reg-name').value,
        shop_name: document.getElementById('reg-shopname').value,
        mobile: document.getElementById('reg-mobile').value,
        pin: document.getElementById('reg-pin').value,
        city: document.getElementById('reg-city').value,
        shop_type: document.getElementById('reg-type').value
    };

    try {
        const res = await fetchAPI('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('bazarmind_user', JSON.stringify(currentUser));
            showMainApp();
            fetchDashboardData();
            fetchInventory();
        } else {
            alert(result.message);
        }
    } catch (err) { console.error(err); }
}

async function handleLogin(e) {
    e.preventDefault();
    const mobile = document.getElementById('log-mobile').value;
    const pin = document.getElementById('log-pin').value;

    try {
        const res = await fetchAPI('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, pin })
        });
        const result = await res.json();
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('bazarmind_user', JSON.stringify(currentUser));
            showMainApp();
            fetchDashboardData();
            fetchInventory();
        } else {
            alert(result.message);
        }
    } catch (err) { console.error(err); }
}

function handleLogout() {
    localStorage.removeItem('bazarmind_user');
    currentUser = null;
    switchView('login');
}

// --- Data Fetching & Rendering ---
async function fetchInventory() {
    try {
        const res = await fetchAPI('/api/inventory');
        const result = await res.json();
        if (result.success) {
            inventoryData = result.inventory;
            renderInventoryList();
            populateBillingProductDropdown();
        }
    } catch (err) { console.error(err); }
}

async function fetchDashboardData() {
    try {
        const res = await fetchAPI('/api/dashboard');
        const result = await res.json();
        if (result.success) {
            dashboardStats = result;
            updateHomeStats();
            renderDashboardTable();
            renderChart();
            renderNotifications();
        }
    } catch (err) { console.error(err); }
}

// --- POS Billing UI Helpers ---
function populateBillingProductDropdown() {
    const select = document.getElementById('bill-prod-select');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="" disabled selected>Select product...</option>';
    
    const sortedInventory = [...inventoryData].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedInventory.forEach(item => {
        const categoryLabel = item.category === 'Grocery' ? 'Grocery' : 'General';
        select.innerHTML += `<option value="${item.id}">[${categoryLabel}] ${item.name} (${item.quantity} ${item.unit} available)</option>`;
    });
    
    if (currentValue && inventoryData.some(p => p.id === parseInt(currentValue))) {
        select.value = currentValue;
    }
}

function renderBillingCart() {
    const tbody = document.getElementById('billing-cart-body');
    tbody.innerHTML = '';
    
    if (billingCart.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state text-center" style="padding: 24px; color: var(--text-muted);">No items added to the bill yet.</td></tr>`;
        document.getElementById('bill-grand-total').textContent = '₹0.00';
        document.getElementById('btn-checkout').disabled = true;
        return;
    }
    
    let grandTotal = 0;
    billingCart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        grandTotal += subtotal;
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.name}</strong><br><small style="color:var(--text-muted)">${item.category}</small></td>
                <td>${item.quantity} ${item.unit}</td>
                <td>₹${item.price}</td>
                <td><strong>₹${subtotal.toFixed(2)}</strong></td>
                <td>
                    <button class="icon-btn" onclick="removeFromCart(${index})" style="color: var(--danger);">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    document.getElementById('bill-grand-total').textContent = `₹${grandTotal.toFixed(2)}`;
    document.getElementById('btn-checkout').disabled = false;
}

window.removeFromCart = function(index) {
    billingCart.splice(index, 1);
    renderBillingCart();
};

// --- Sales Analysis Summary ---
async function fetchSalesSummary() {
    try {
        const res = await fetchAPI('/api/sales-summary');
        const result = await res.json();
        if (result.success) {
            document.getElementById('analysis-revenue').textContent = `₹${result.summary.revenue_today.toFixed(2)}`;
            document.getElementById('analysis-items-sold').textContent = result.summary.items_sold_today;
            document.getElementById('analysis-items-added').textContent = result.summary.items_added_today;
            
            // Render Smart Alerts
            const alertsList = document.getElementById('analysis-alerts-list');
            alertsList.innerHTML = '';
            if (result.alerts && result.alerts.length > 0) {
                result.alerts.forEach(alert => {
                    const icon = alert.type === 'high_demand' 
                        ? '<i class="fas fa-fire" style="color: var(--primary);"></i>' 
                        : '<i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>';
                    
                    const borderStyle = alert.type === 'high_demand' 
                        ? 'border-left: 4px solid var(--primary);' 
                        : 'border-left: 4px solid var(--danger);';
                    
                    alertsList.innerHTML += `
                        <div class="list-item" style="${borderStyle} padding: 12px; margin-bottom: 8px; background: var(--card-bg); border-radius: 8px; display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 1.2rem;">${icon}</div>
                            <div style="flex: 1;">
                                <p style="font-size: 0.85rem; font-weight: 500; margin: 0; line-height: 1.4;">${alert.message}</p>
                            </div>
                        </div>
                    `;
                });
            } else {
                alertsList.innerHTML = '<div class="empty-state" style="padding: 16px; text-align: center; color: var(--text-muted);">No active alerts. Inventory levels are stable!</div>';
            }
            
            // Render Sales Feed
            const salesFeed = document.getElementById('analysis-sales-feed');
            salesFeed.innerHTML = '';
            if (result.transactions && result.transactions.length > 0) {
                result.transactions.forEach(tx => {
                    const time = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    salesFeed.innerHTML += `
                        <tr>
                            <td>${time}</td>
                            <td><strong>${tx.product_name}</strong><br><small style="color:var(--text-muted)">${tx.category}</small></td>
                            <td>${tx.quantity}</td>
                            <td><strong>₹${tx.total.toFixed(2)}</strong></td>
                        </tr>
                    `;
                });
            } else {
                salesFeed.innerHTML = `<tr><td colspan="4" class="empty-state text-center" style="padding: 24px; color: var(--text-muted);">No sales logged today.</td></tr>`;
            }
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Home Stats Rendering ---
function updateHomeStats() {
    if (!dashboardStats.stats) return;
    
    document.getElementById('stat-total-products').textContent = dashboardStats.stats.total_products;
    document.getElementById('stat-low-stock').textContent = dashboardStats.stats.low_stock_items;
    document.getElementById('stat-today-sales').textContent = `₹${dashboardStats.stats.today_sales.toFixed(2)}`;

    // Festival Banner
    if (dashboardStats.festivals && dashboardStats.festivals.length > 0) {
        const fest = dashboardStats.festivals[0];
        document.getElementById('festival-banner').classList.remove('hidden');
        document.getElementById('festival-message').textContent = fest.message;
    }

    // Home Low Stock List
    const lowStockContainer = document.getElementById('home-low-stock-list');
    lowStockContainer.innerHTML = '';
    if (dashboardStats.low_stock_alerts && dashboardStats.low_stock_alerts.length > 0) {
        dashboardStats.low_stock_alerts.slice(0, 3).forEach(item => {
            lowStockContainer.innerHTML += `
                <div class="list-item">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p>Stock: ${item.quantity} ${item.unit}</p>
                    </div>
                    <span class="status-badge status-low">Low</span>
                </div>
            `;
        });
    } else {
        lowStockContainer.innerHTML = '<div class="list-item"><p>Stock levels are good!</p></div>';
    }
}

// --- Inventory Rendering ---
function renderInventoryList() {
    const searchTerm = document.getElementById('search-inventory').value.toLowerCase();
    const container = document.getElementById('full-inventory-list');
    if (!container) return;
    container.innerHTML = '';

    let filtered = inventoryData;

    // Category section filtering (Grocery vs General)
    if (currentInventoryCategory !== 'All') {
        filtered = filtered.filter(item => item.category === currentInventoryCategory);
    }

    // Search query filtering
    if (searchTerm) {
        filtered = filtered.filter(item => item.name.toLowerCase().includes(searchTerm));
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-muted);">No products found.</div>';
        return;
    }

    filtered.forEach(item => {
        const isLow = item.quantity <= item.reorder_level;
        const statusClass = isLow ? 'status-low' : 'status-ok';
        
        // Category styling labels
        const categoryLabel = item.category === 'Grocery' ? 'Grocery' : (item.category === 'General' ? 'General Store' : item.category);
        const categoryClass = item.category === 'Grocery' ? 'badge-grocery' : (item.category === 'General' ? 'badge-general' : 'badge-festival');
        
        container.innerHTML += `
            <div class="list-item">
                <div class="item-details">
                    <h4 style="display: flex; align-items: center; gap: 8px;">
                        ${item.name}
                        <span class="store-badge ${categoryClass}">${categoryLabel}</span>
                    </h4>
                    <p>Price: ₹${item.price}/${item.unit} • Reorder below: ${item.reorder_level} ${item.unit}</p>
                </div>
                <div class="item-actions">
                    <span class="status-badge ${statusClass}" style="font-weight: bold; font-size: 0.9rem">${item.quantity} ${item.unit}</span>
                    <button class="icon-btn" onclick="deleteProduct(${item.id})" style="color: var(--danger)"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

function renderDashboardTable() {
    const filterCat = document.getElementById('filter-category').value;
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = filterCat === 'All' ? inventoryData : inventoryData.filter(i => i.category === filterCat);

    filtered.forEach(item => {
        const statusClass = item.quantity <= item.reorder_level ? 'status-low' : 'status-ok';
        const statusText = item.quantity <= item.reorder_level ? 'Low' : 'OK';
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.name}</strong><br><small style="color:var(--text-muted)">₹${item.price}</small></td>
                <td>${item.quantity} ${item.unit}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    });

    // Top Selling List
    const topList = document.getElementById('top-selling-list');
    if (topList && dashboardStats.top_selling) {
        topList.innerHTML = dashboardStats.top_selling.map(name => `<li><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> ${name}</li>`).join('');
    }
}

let salesChartInstance = null;

function renderChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas || !dashboardStats.weekly_sales) return;
    
    const labels = dashboardStats.weekly_sales.map(s => s.day);
    const data = dashboardStats.weekly_sales.map(s => s.sales);

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (₹)',
                data: data,
                backgroundColor: '#FF6B35',
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// --- Notifications ---
function toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        document.getElementById('notification-badge').textContent = '0';
    }
}

function renderNotifications() {
    const container = document.getElementById('notification-content');
    if (!container) return;
    container.innerHTML = '';
    let count = 0;

    // Festivals
    if (dashboardStats.festivals) {
        dashboardStats.festivals.forEach(fest => {
            container.innerHTML += `
                <div class="notif-item festival">
                    <strong>Festival Alert: ${fest.name}</strong><br>
                    <small>${fest.message}</small>
                </div>
            `;
            count++;
        });
    }

    // Low Stock
    if (dashboardStats.low_stock_alerts) {
        dashboardStats.low_stock_alerts.forEach(item => {
            container.innerHTML += `
                <div class="notif-item">
                    <strong>Low Stock: ${item.name}</strong><br>
                    <small>Current stock is ${item.quantity} ${item.unit} (Reorder level: ${item.reorder_level})</small>
                </div>
            `;
            count++;
        });
    }

    const badge = document.getElementById('notification-badge');
    if (badge) badge.textContent = count;
}

// --- Add / Delete Product ---
async function handleAddProduct(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('prod-name').value,
        category: document.getElementById('prod-cat').value,
        quantity: document.getElementById('prod-qty').value,
        unit: document.getElementById('prod-unit').value,
        price: document.getElementById('prod-price').value,
        reorder_level: document.getElementById('prod-reorder').value
    };

    try {
        const res = await fetchAPI('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert('Product added successfully!');
            e.target.reset();
            fetchInventory();
            fetchDashboardData();
        }
    } catch (err) { console.error(err); }
}

async function deleteProduct(id) {
    if(!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res = await fetchAPI(`/api/inventory/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if(result.success) {
            fetchInventory();
            fetchDashboardData();
        }
    } catch (err) { console.error(err); }
}
