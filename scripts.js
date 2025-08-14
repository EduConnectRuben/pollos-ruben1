document.addEventListener('DOMContentLoaded', () => {

    const initialMenuItems = [
        {"id":1,"name":"Hamburguesa Simple","category":"hamburguesas","price":35.00,"description":"Carne jugosa, lechuga fresca, tomate y nuestras salsas clásicas.","image":"images/hamburgesa simple.png","stock":20},
        {"id":2,"name":"Hamburguesa Doble","category":"hamburguesas","price":45.00,"description":"Doble porción de carne y queso para los verdaderos amantes de las burgers.","image":"images/hamb doble.png","stock":15},
        {"id":13,"name":"Hamburguesa Especial","category":"hamburguesas","price":55.00,"description":"Con tocino crujiente, aros de cebolla y nuestra salsa barbacoa secreta.","image":"images/hamb especial.png","stock":10},
        {"id":3,"name":"Lomito Simple","category":"lomitos","price":40.00,"description":"Tierno lomito de res a la plancha, con chimichurri, lechuga y tomate.","image":"images/lomito simple.png","stock":10},
        {"id":4,"name":"Lomito Doble","category":"lomitos","price":50.00,"description":"El doble de sabor con extra lomito y huevo frito.","image":"images/lomito doble.png","stock":8},
        {"id":15,"name":"Lomito Especial","category":"lomitos","price":60.00,"description":"El rey de la casa: lomito, doble queso, tocino, huevo y pimientos.","image":"images/lomito especial.png","stock":7},
        {"id":6,"name":"Pollo Económico","category":"pollos","price":25.00,"description":"Una presa de nuestro delicioso pollo con una porción de papas fritas.","image":"images/pollo eco.png","stock":15},
        {"id":5,"name":"Pollo Cuarto","category":"pollos","price":35.00,"description":"Jugoso cuarto de pollo marinado a las brasas, acompañado de papas y ensalada.","image":"images/pollo cuarto.png","stock":12},
        {"id":16,"name":"Pollo Especial","category":"pollos","price":45.00,"description":"Un jugoso cuarto de pollo con chorizo, papas fritas especiales y doble ensalada.","image":"images/pollo especial.png","stock":10},
        {"id":7,"name":"Coca-Cola 2Litros","category":"sodas","price":15.00,"description":"La clásica e inconfundible gaseosa para acompañar tu comida.","image":"images/cocacola.png","stock":50},
        {"id":8,"name":"Fanta 2Litros","category":"sodas","price":15.00,"description":"Refrescante sabor a naranja que te encantará.","image":"images/fanta.png","stock":40},
        {"id":9,"name":"Sprite 2Litros","category":"sodas","price":15.00,"description":"El toque cítrico perfecto para tu paladar.","image":"images/sprite.png","stock":0},
        {"id":10,"name":"Vaso de Limonada","category":"refrescos","price":3.00,"description":"Hecha con limones frescos, ideal para calmar la sed.","image":"images/limonada.png","stock":18},
        {"id":11,"name":"Vaso de Mocochinchi","category":"refrescos","price":3.00,"description":"Bebida tradicional a base de durazno deshidratado y canela.","image":"images/mocochinchi.png","stock":9},
        {"id":12,"name":"Vaso de Chicha","category":"refrescos","price":3.00,"description":"Clásico refresco hecho de maíz morado, piña y especias.","image":"images/chicha.png","stock":4}
    ];

    let menuItems = []; 
    let cart = [];
    let pdfGenerator = null;

    function initApp() {
        setupLogin();
    }
    
    function loadApp() {
        loadStockData();
        loadCartFromStorage();
        setupAllPages();
        switchPage('inicio'); 
    }
    
    function loadStockData() {
        const storedStock = localStorage.getItem('productStock');
        if (storedStock) menuItems = JSON.parse(storedStock);
        else {
            menuItems = initialMenuItems;
            localStorage.setItem('productStock', JSON.stringify(menuItems));
        }
    }

    function setupAllPages() {
        setupNavigation();
        setupSuccessModal();
        updateCartCounter();
        setupMenuPage();
        setupCartPage();
        setupReservationPage();
    }

    const loadCartFromStorage = () => cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    const saveCartToStorage = () => { localStorage.setItem('shoppingCart', JSON.stringify(cart)); updateCartCounter(); };

    const addToCart = (itemId) => {
        const itemInMenu = menuItems.find(i => i.id === itemId);
        const itemInCart = cart.find(i => i.id === itemId);
        const quantityInCart = itemInCart ? itemInCart.quantity : 0;
        if (quantityInCart >= itemInMenu.stock) return showNotification(`No hay más stock de ${itemInMenu.name}`, 'error');
        if (itemInCart) itemInCart.quantity++; else cart.push({ ...itemInMenu, quantity: 1 });
        showNotification(`${itemInMenu.name} añadido al carrito!`);
        saveCartToStorage();
        renderMenu();
    };

    const updateCartQuantity = (itemId, newQuantity) => {
        const cartItem = cart.find(i => i.id === itemId);
        if (!cartItem) return;
        const itemInMenu = menuItems.find(i => i.id === itemId);
        if (newQuantity > itemInMenu.stock) newQuantity = itemInMenu.stock;
        if (newQuantity <= 0) cart = cart.filter(i => i.id !== itemId); else cartItem.quantity = newQuantity;
        saveCartToStorage();
        renderCartPage();
        renderMenu();
    };
    
    const updateCartCounter = () => {
        const counter = document.getElementById('cart-counter');
        if (counter) counter.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    const updateStockAfterPurchase = () => {
        cart.forEach(cartItem => {
            const stockItem = menuItems.find(stockItem => stockItem.id === cartItem.id);
            if (stockItem) stockItem.stock -= cartItem.quantity;
        });
        localStorage.setItem('productStock', JSON.stringify(menuItems));
    };

    function renderMenu() {
        const menuGrid = document.getElementById('menu-grid');
        if (!menuGrid) return;
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const category = document.getElementById('category-filter')?.value || 'all';
        let itemsToRender = menuItems;
        if (category !== 'all') itemsToRender = itemsToRender.filter(item => item.category === category);
        if (searchTerm) itemsToRender = itemsToRender.filter(item => item.name.toLowerCase().includes(searchTerm));
        menuGrid.innerHTML = '';
        if (itemsToRender.length === 0) menuGrid.innerHTML = '<p style="text-align: center;">No se encontraron productos.</p>';
        itemsToRender.forEach(item => {
            const quantityInCart = cart.find(ci => ci.id === item.id)?.quantity || 0;
            const currentStock = item.stock - quantityInCart;
            let stockStatus, stockText;
            if (currentStock > 10) { stockStatus = 'available'; stockText = 'Disponible'; } 
            else if (currentStock > 5) { stockStatus = 'few-left'; stockText = `¡Quedan solo ${currentStock}!`; } 
            else if (currentStock > 0) { stockStatus = 'last-units'; stockText = `¡Últimas ${currentStock} unidades!`; } 
            else { stockStatus = 'not-available'; stockText = 'Agotado'; }
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<img src="${item.image}" alt="${item.name}" class="card-img"><div class="card-body"><h3 class="card-title">${item.name}</h3><p class="card-text">${item.description}</p><div class="card-footer"><div><p class="price">Bs ${item.price.toFixed(2)}</p><span class="stock ${stockStatus}">${stockText}</span></div><button class="cta-button add-to-cart-btn" data-id="${item.id}" ${currentStock === 0 ? 'disabled' : ''}>Añadir</button></div></div>`;
            menuGrid.appendChild(card);
        });
    }
    
    function renderCartPage() {
        const cartItemsList = document.getElementById('cart-items-list');
        if (!cartItemsList) return;
        const cartTotalPrice = document.getElementById('cart-total-price');
        cartItemsList.innerHTML = '';
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p>Tu carrito está vacío. <a href="#">¡Ve al menú!</a></p>';
            cartItemsList.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); switchPage('menu'); });
            cartTotalPrice.textContent = 'Bs 0.00';
            document.getElementById('checkout-btn').disabled = true;
            return;
        }
        document.getElementById('checkout-btn').disabled = false;
        let total = 0;
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `<img src="${item.image}" alt="${item.name}" class="cart-item-img"><div class="cart-item-info"><h4 class="cart-item-title">${item.name}</h4><p class="cart-item-price">Bs ${item.price.toFixed(2)}</p></div><div class="cart-item-actions"><div class="quantity-controls"><button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button><input type="number" value="${item.quantity}" min="1" max="${item.stock}" data-id="${item.id}" class="quantity-input" readonly><button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button></div><button class="remove-item-btn" data-id="${item.id}">&times;</button></div>`;
            cartItemsList.appendChild(itemElement);
            total += item.price * item.quantity;
        });
        cartTotalPrice.textContent = `Bs ${total.toFixed(2)}`;
    }

    function setupMenuPage() {
        const menuPageContent = document.getElementById('menu-grid');
        if (!menuPageContent) return;
        renderMenu();
        document.getElementById('search-input').addEventListener('input', renderMenu);
        document.getElementById('category-filter').addEventListener('change', renderMenu);
        menuPageContent.addEventListener('click', e => {
            if (e.target.classList.contains('add-to-cart-btn')) addToCart(Number(e.target.dataset.id));
        });
    }

    function setupCartPage() {
        const cartContainer = document.getElementById('cart-container');
        if (!cartContainer) return;
        cartContainer.addEventListener('click', e => {
            const target = e.target;
            const itemId = Number(target.dataset.id);
            if (target.classList.contains('remove-item-btn')) updateCartQuantity(itemId, 0);
            if (target.classList.contains('quantity-btn')) {
                const action = target.dataset.action;
                const cartItem = cart.find(item => item.id === itemId);
                if (cartItem) {
                    let newQuantity = cartItem.quantity;
                    if (action === 'increase') newQuantity++;
                    else if (action === 'decrease') newQuantity--;
                    updateCartQuantity(itemId, newQuantity);
                }
            }
        });
        document.getElementById('checkout-btn').addEventListener('click', () => {
            showSuccessModal('¡Pedido Realizado!', 'Tu pedido ha sido procesado exitosamente.', generateOrderPDF);
        });
        renderCartPage();
    }

    function setupReservationPage() {
        const reservationForm = document.getElementById('reservation-form');
        if (!reservationForm) return;
        reservationForm.addEventListener('submit', e => {
            e.preventDefault();
            const reservationData = Object.fromEntries(new FormData(reservationForm).entries());
            showSuccessModal('¡Reserva Confirmada!', 'Tu mesa ha sido reservada con éxito.', () => generateReservationPDF(reservationData));
            reservationForm.reset();
        });
    }

    function switchPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId)?.classList.add('active');
        document.querySelectorAll('.main-nav .nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });
    }

    function setupNavigation() {
        document.querySelector('.main-nav').addEventListener('click', (e) => {
            if (e.target.matches('.nav-link, .nav-link *')) {
                e.preventDefault();
                const link = e.target.closest('.nav-link');
                if (link.dataset.page) switchPage(link.dataset.page);
            }
        });
        const heroButton = document.querySelector('.hero .cta-button');
        if(heroButton) {
            heroButton.addEventListener('click', (e) => {
                e.preventDefault();
                switchPage(e.target.dataset.page);
            });
        }
    }
    
    function setupLogin() {
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.getElementById('app-container');
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        const logoutBtn = document.getElementById('logout-btn');
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown-content');

        if (sessionStorage.getItem('loggedInUser')) {
            loginScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
            document.getElementById('welcome-user').textContent = `Hola, ${user.username}`;
            loadApp();
        } else {
            loginScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            if (usernameInput.value === 'cliente' && passwordInput.value === '1234') {
                const user = { username: 'Cliente' };
                sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                loginScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                document.getElementById('welcome-user').textContent = `Hola, ${user.username}`;
                loginError.style.display = 'none';
                loadApp();
            } else {
                loginError.style.display = 'block';
            }
        });

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            window.location.reload();
        });
        
        userMenuBtn.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
        window.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }

    function setupSuccessModal() {
        const successModal = document.getElementById('success-modal');
        const closeBtn = document.querySelector('#success-modal .modal-close');
        const generatePdfBtn = document.getElementById('generate-pdf-btn');
        closeBtn?.addEventListener('click', () => successModal.style.display = 'none');
        generatePdfBtn?.addEventListener('click', () => {
            if (typeof pdfGenerator === 'function') pdfGenerator();
            successModal.style.display = 'none';
        });
    }

    function showSuccessModal(title, message, pdfGenFunc) {
        document.getElementById('success-modal-title').textContent = title;
        document.getElementById('success-modal-message').textContent = message;
        pdfGenerator = pdfGenFunc;
        document.getElementById('success-modal').style.display = 'flex';
    }

    // ===================================================================
    // 6. GENERACIÓN DE PDF Y NOTIFICACIONES
    // ===================================================================
    function generateOrderPDF() {
        if (typeof window.jspdf === 'undefined') return showNotification("Error: Librería PDF no cargada.", "error");
        if (cart.length === 0) return showNotification("El carrito está vacío.", "error");
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
        
        doc.setFontSize(22); doc.setFont('helvetica', 'bold');
        doc.text('Comprobante de Pedido - Pollos Rubén', 105, 20, { align: 'center' });
        doc.setFontSize(12); doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 35);
        doc.text(`Cliente: ${user ? user.username : 'Invitado'}`, 20, 41);
        
        const tableColumn = ["Producto", "Cantidad", "Precio Unit.", "Subtotal"];
        const tableRows = []; 
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            tableRows.push([item.name, item.quantity, `Bs ${item.price.toFixed(2)}`, `Bs ${itemTotal.toFixed(2)}`]);
            total += itemTotal;
        });
        
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 50 });
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text(`Total Pagado: Bs ${total.toFixed(2)}`, 190, doc.lastAutoTable.finalY + 15, { align: 'right' });

        // --- MEJORA CLAVE: ABRIR EN LUGAR DE SOLO GUARDAR ---
        try {
            // Genera el PDF como una URL temporal en el navegador
            const pdfUrl = doc.output('bloburl');
            // Abre esa URL en una nueva pestaña
            window.open(pdfUrl, '_blank');
            showNotification("Factura generada en una nueva pestaña.");
        } catch (e) {
            console.error("Error al abrir el PDF:", e);
            showNotification("Error al mostrar la factura. Se descargará en su lugar.", "error");
            doc.save(`pedido-pollos-ruben-${Date.now()}.pdf`);
        }

        updateStockAfterPurchase();
        cart = []; 
        saveCartToStorage(); 
        renderCartPage(); 
        renderMenu();
    }

    function generateReservationPDF(data) {
        if (typeof window.jspdf === 'undefined') return showNotification("Error: Librería PDF no cargada.", "error");
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));

        doc.setFontSize(22); doc.setFont('helvetica', 'bold');
        doc.text('Comprobante de Reserva - Pollos Rubén', 105, 20, { align: 'center' });
        doc.setFontSize(12); doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 20, 35);
        doc.text(`Reservado por: ${user ? user.username : data.name}`, 20, 41);
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('Detalles de la Reserva', 20, 60);
        doc.autoTable({ startY: 65, theme: 'plain', body: [['Nombre:', data.name], ['Email:', data.email], ['Fecha:', data.date], ['Hora:', data.time], ['Personas:', data.guests]] });
        doc.setFontSize(10);
        doc.text('Por favor, presenta este comprobante al llegar al restaurante.', 20, doc.lastAutoTable.finalY + 20);
        
        // --- MEJORA CLAVE: ABRIR EN LUGAR DE SOLO GUARDAR ---
        try {
            const pdfUrl = doc.output('bloburl');
            window.open(pdfUrl, '_blank');
            showNotification("Reserva generada en una nueva pestaña.");
        } catch (e) {
            console.error("Error al abrir el PDF:", e);
            showNotification("Error al mostrar la reserva. Se descargará en su lugar.", "error");
            doc.save(`reserva-pollos-ruben-${Date.now()}.pdf`);
        }
    }

    function showNotification(message, type = 'success') {
        const el = document.getElementById('notification');
        if (!el) return;
        el.textContent = message;
        el.style.background = type === 'error' ? 'linear-gradient(to right, #D32F2F, #E64A19)' : 'linear-gradient(to right, #43a047, #66bb6a)';
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    }
    
    initApp();
});
