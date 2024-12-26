// DOM Elements
const menuItemsContainer = document.querySelector('.menu__items');

// State management
let menuData = [];
let stockData = [];

// Fetch all necessary data from the database
async function fetchData() {
    try {
        const [problemResponse, stockResponse] = await Promise.all([
            fetch('http://localhost:3000/problem1-data'),
            fetch('http://localhost:3000/problem2-data')
        ]);

        const problems = await problemResponse.json();
        stockData = await stockResponse.json();

        return problems;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Update menu items display
function updateMenuDisplay(problems) {
    const menuItems = document.querySelectorAll('.menu__item');
    
    menuItems.forEach(item => {
        const itemId = parseInt(item.dataset.id);
        const problemData = problems.find(p => p.Cookie_id === itemId);
        const addToCartBtn = item.querySelector('.menu__item-add-to-cart');
        
        if (problemData) {
            // Update quantity display
            const descriptionElement = item.querySelector('.menu__item-description');
            descriptionElement.innerHTML = `
                Stock Available: ${problemData.Quantity} pieces<br>
                ${descriptionElement.textContent}
            `;

            // Disable button if out of stock
            if (problemData.Quantity <= 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Out of Stock';
                addToCartBtn.classList.add('disabled');
            } else {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'Add to Cart';
                addToCartBtn.classList.remove('disabled');
            }
        }
    });
}

// Handle stock updates
async function updateStock(cookieId, quantity) {
    try {
        const response = await fetch('http://localhost:3000/update-stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cookie_id: cookieId,
                quantity: quantity
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update stock');
        }

        // Refresh data after update
        const newData = await fetchData();
        updateMenuDisplay(newData);
    } catch (error) {
        console.error('Error updating stock:', error);
    }
}

// Real-time updates using WebSocket or Server-Sent Events
function setupRealTimeUpdates() {
    const eventSource = new EventSource('http://localhost:3000/stock-updates');
    
    eventSource.onmessage = async function(event) {
        const updatedData = JSON.parse(event.data);
        updateMenuDisplay(updatedData);
    };

    eventSource.onerror = function(error) {
        console.error('EventSource failed:', error);
        eventSource.close();
    };
}

// Initialize menu
async function initializeMenu() {
    const data = await fetchData();
    if (data) {
        menuData = data;
        updateMenuDisplay(data);
        setupRealTimeUpdates();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeMenu);

// Add event listeners for cart operations
document.querySelectorAll('.menu__item-add-to-cart').forEach(button => {
    button.addEventListener('click', async function(e) {
        const menuItem = e.target.closest('.menu__item');
        const itemId = parseInt(menuItem.dataset.id);
        
        // Update stock in database
        await updateStock(itemId, -1); // Decrease stock by 1
    });
});