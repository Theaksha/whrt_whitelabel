
import { getPOSLayout, injectPOSStyles } from './pos_ui.js';
import { ItemSelector } from './pos_item_selector.js';
import { ItemCart } from './pos_item_cart.js';
import { NumberPad } from './pos_number_pad.js';
import { PaymentPanel } from './pos_payment.js';
import { CustomerSelector } from './pos_customer.js';
import { ProfileLogin } from './pos_profile.js';

// Database name and version
const DB_NAME = 'pos_offline_db';
const DB_VERSION = 1;
const STORES = {
    ITEMS: 'items',
    ITEM_GROUPS: 'item_groups',
    CUSTOMERS: 'customers',
    PENDING_ORDERS: 'pending_orders',
    PROFILE_DATA: 'profile_data'
};

export class PointOfSale {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.cart = {};
        this.isCheckoutView = false;
        this.items = [];
        this.itemGroups = [];
        this.pageStart = 0;
        this.pageLength = 50;
        this.priceList = "Standard Selling";
        this.currentGroup = "";
        this.posProfile = null;
        this.currency = "₹";
        this.taxTemplate = "";
        this.warehouse = "";
        this.paymentMethods = [];
        this.searchTimeout = null;
        this.selected_customer = null;
        this.isOnline = navigator.onLine;
        this.db = null;

        // Initialize database
        this._initDB().then(() => {
            this._setupNetworkListeners();
            this._showProfileLogin();
        });
    }

    _setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this._onConnectionRestored();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            frappe.show_alert({ message: __('You are now offline'), indicator: 'orange' });
        });
    }

    async _initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(STORES.ITEMS)) {
                    db.createObjectStore(STORES.ITEMS, { keyPath: 'item_code' });
                }
                if (!db.objectStoreNames.contains(STORES.ITEM_GROUPS)) {
                    db.createObjectStore(STORES.ITEM_GROUPS, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
                    db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(STORES.PENDING_ORDERS)) {
                    db.createObjectStore(STORES.PENDING_ORDERS, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.PROFILE_DATA)) {
                    db.createObjectStore(STORES.PROFILE_DATA, { keyPath: 'profile_name' });
                }
            };
        });
    }

    _showError(message, title = __('Error')) {
        frappe.msgprint({
            title: title,
            message: message,
            indicator: 'red'
        });
        console.error(title + ":", message);
    }

    _showProfileLogin() {
        new ProfileLogin(async (selectedProfile) => {
            try {
                const success = await this._loadProfileDetails(selectedProfile);
                if (!success) {
                    this._showProfileLogin();
                }
            } catch (error) {
                console.error("Profile selection error:", error);
                this._showError(__('Error loading selected profile'));
                this._showProfileLogin();
            }
        });
    }

    async _loadProfileDetails(profileName) {
        if (!profileName) {
            this._showError(__('POS Profile is required'));
            return false;
        }

        try {
            // Try to load from server if online
            if (this.isOnline) {
                const r = await frappe.call({
                    method: "whrt_whitelabel.apis.pos.get_pos_profile_details",
                    args: { pos_profile: profileName },
                    freeze: true,
                    freeze_message: __('Loading POS Profile...')
                });

                if (!r.message) {
                    throw new Error(__('No response from server'));
                }

                if (r.message.error) {
                    throw new Error(r.message.error);
                }

                if (!r.message.payment_methods || r.message.payment_methods.length === 0) {
                    throw new Error(__('No payment methods configured for this POS Profile'));
                }

                if (!r.message.warehouse) {
                    throw new Error(__('No warehouse configured for this POS Profile'));
                }

                this.posProfile = profileName;
                this.paymentMethods = r.message.payment_methods;
                this.taxTemplate = r.message.tax_template || "";
                this.warehouse = r.message.warehouse;
                this.itemGroups = r.message.item_groups || [];
		// Save item groups separately to the dedicated object store
	// Save item groups separately to the dedicated object store
const txGroups = this.db.transaction(STORES.ITEM_GROUPS, 'readwrite');
const groupStore = txGroups.objectStore(STORES.ITEM_GROUPS);
await groupStore.clear(); // Optional: clear old entries
this.itemGroups.forEach(group => groupStore.put(group));


                this.currency = r.message.currency || "₹";

                // Save profile data to IndexedDB
                await this._saveToDB(STORES.PROFILE_DATA, {
                    profile_name: profileName,
                    data: {
                        payment_methods: this.paymentMethods,
                        tax_template: this.taxTemplate,
                        warehouse: this.warehouse,
                        item_groups: this.itemGroups,
                        currency: this.currency
                    }
                });
            } else {
                // Offline mode - load from IndexedDB
                const profileData = await this._getFromDB(STORES.PROFILE_DATA, profileName);
                if (!profileData) {
                    throw new Error(__('Profile data not available offline'));
                }

                this.posProfile = profileName;
                this.paymentMethods = profileData.data.payment_methods;
                this.taxTemplate = profileData.data.tax_template || "";
                this.warehouse = profileData.data.warehouse;
                this.itemGroups = profileData.data.item_groups || [];
                this.currency = profileData.data.currency || "₹";

                frappe.show_alert({ message: __('Working in offline mode'), indicator: 'orange' });
            }

            await this._renderPage();
            this.itemSelector.renderGroups(this.itemGroups);
            await this._loadInitialData();

            return true;

        } catch (error) {
            console.error("Profile load error:", error);
            this._showError(
                __('Failed to load profile: {0}', [error.message]),
                __('Initialization Error')
            );
            this.posProfile = null;
            this._showProfileLogin();
            return false;
        }
    }

    async _loadInitialData() {
        try {
            await this._loadItems();
            await this._loadCustomers();

	// Fallback if itemGroups is still empty
if (!this.itemGroups || this.itemGroups.length === 0) {
    console.warn('Loading item groups from item_groups store as fallback');
    this.itemGroups = await this._getAllFromDB(STORES.ITEM_GROUPS);
}

            
            // If online, sync any pending orders
            if (this.isOnline) {
                await this._syncPendingOrders();
		await this._cacheAllItemsToIndexedDB();
            }
        } catch (error) {
            console.error("Initial data load error:", error);
            this._showError(
                __('Partial data loaded: {0}', [error.message]),
                __('Warning')
            );
        }
    }

async _cacheAllItemsToIndexedDB() {
    try {
        if (!this.isOnline) {
            console.warn("Offline mode: skipping full item cache");
            return;
        }

        const r = await frappe.call({
            method: "whrt_whitelabel.apis.pos.get_items",
            args: {
                start: 0,
                page_length: 10000,  // Fetch a large number
                pos_profile: this.posProfile,
                item_group: "",
                search_term: ""
            }
        });

        const items = Array.isArray(r.message?.items) ? r.message.items : r.message;

        const tx = this.db.transaction(STORES.ITEMS, 'readwrite');
        const store = tx.objectStore(STORES.ITEMS);
        await store.clear();  // clear previous entries

        items.forEach(item => store.put(item));

        console.log(`✅ Cached ${items.length} items to IndexedDB`);
    } catch (error) {
        console.error("Failed to cache all items:", error);
        this._showError("Could not cache all items for offline mode");
    }
}


    async _renderPage() {
        $(this.wrapper).html(getPOSLayout(this.posProfile, this.currency));
        injectPOSStyles();

        $('.logout-btn').on('click', () => this._logout());

        this.itemSelector = new ItemSelector(this);

	$('#btn-view-customer-summary').on('click', () => {
    const customerId = this.selected_customer?.id || $('.customer-search').val()?.trim();
    if (!customerId) {
        frappe.msgprint("Please select a customer first.");
        return;
    }
    this._showCustomerSummary(customerId);
});


	// Make sure item groups are rendered to dropdown
if (this.itemGroups && this.itemGroups.length > 0) {
    this.itemSelector.renderGroups(this.itemGroups);
} else {
    console.warn("Item groups not available when rendering dropdown");
}


        this.cartView = new ItemCart(this);
        this.numpad = new NumberPad(this);
        this.payment = new PaymentPanel(this);
        this.customerSelector = new CustomerSelector(this);


       $('.page-next').on('click', () => {
    this.pageStart += this.pageLength;
    this._loadItems($('.item-search').val().trim());
});

$('.page-prev').on('click', () => {
    this.pageStart = Math.max(0, this.pageStart - this.pageLength);
    this._loadItems($('.item-search').val().trim());
});



        $('.item-search').on('input', e => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.pageStart = 0;
                this._loadItems(e.target.value.trim());
            }, 300);
        });

        $('.item-group-search').on('change', e => {
            const selectedGroup = e.target.value.trim();
            if (this.itemGroups.some(g => g.name === selectedGroup)) {
                this.currentGroup = selectedGroup;
                this.pageStart = 0;
                this._loadItems($('.item-search').val().trim());
            }
        });
    }

    async _loadItems(search = "", group = "") {
        try {
            if (this.isOnline) {
                // Online mode - fetch from server and cache
                const r = await frappe.call({
                    method: "whrt_whitelabel.apis.pos.get_items",
                    args: {
                        start: this.pageStart,
                        page_length: this.pageLength,
                        pos_profile: this.posProfile,
                        item_group: group || this.currentGroup,
                        search_term: search
                    }
                });

                let items = [];
                if (Array.isArray(r.message)) {
                    items = r.message;
                } else if (r.message && Array.isArray(r.message.items)) {
                    items = r.message.items;
                } else if (r.message && r.message.error) {
                    throw new Error(r.message.error);
                } else {
                    throw new Error("Unexpected API response format");
                }

                this.items = items;
                
                // Cache items in IndexedDB
                const tx = this.db.transaction(STORES.ITEMS, 'readwrite');
                const store = tx.objectStore(STORES.ITEMS);
                items.forEach(item => store.put(item));
            } else {
                // Offline mode - load from IndexedDB
                const allItems = await this._getAllFromDB(STORES.ITEMS);
                
                // Filter items based on search and group
                this.items = allItems.filter(item => {
                    const matchesSearch = search === "" || 
                        item.item_name.toLowerCase().includes(search.toLowerCase()) || 
                        item.item_code.toLowerCase().includes(search.toLowerCase());
                    
                    const matchesGroup = !group || item.item_group === group;
                    
                    return matchesSearch && matchesGroup;
                }).slice(this.pageStart, this.pageStart + this.pageLength);
            }

            this.itemSelector.renderItems(this.items, this.cart);

           // Show page number
const currentPage = Math.floor(this.pageStart / this.pageLength) + 1;
$('.page-info').text(`Page ${currentPage}`);

            
        } catch (error) {
            console.error("Items load error:", error);
            this._showError(__('Failed to load items: {0}', [error.message]));
            this.items = [];
            this.itemSelector.renderItems(this.items, this.cart);
        }
    }

    async _loadCustomers() {
        try {
            if (this.isOnline) {
                // Online mode - fetch from server and cache
                const r = await frappe.call({
                    method: "whrt_whitelabel.apis.pos.get_customers"
                });
                const customers = Array.isArray(r.message?.customers) ? r.message.customers : [];
                this.customerSelector.load(customers);
                
                // Cache customers in IndexedDB
                const tx = this.db.transaction(STORES.CUSTOMERS, 'readwrite');
                const store = tx.objectStore(STORES.CUSTOMERS);
                customers.forEach(customer => store.put(customer));
            } else {
                // Offline mode - load from IndexedDB
                const customers = await this._getAllFromDB(STORES.CUSTOMERS);
                this.customerSelector.load(customers);
            }
        } catch (error) {
            console.error("Customer load failed:", error);
            this._showError(__('Failed to load customers'));
        }
    }


   async _showCustomerSummary(customerId) {
    if (!customerId || !this.isOnline) {
        console.warn("No customer ID or offline");
        return;
    }

    console.log("Fetching summary for customer:", customerId); // ✅ DEBUG

    try {
        const r = await frappe.call({
            method: "whrt_whitelabel.apis.pos.get_customer_summary",
            args: { customer_id: customerId }
        });

        const data = r.message;

        if (data.error) {
            return this._showError(data.error);
        }

        const rows = data.recent_invoices.map(inv => `
            <tr>
                <td>${inv.name}</td>
                <td>${inv.posting_date}</td>
                <td>${this.currency} ${inv.grand_total.toFixed(2)}</td>
                <td>${this.currency} ${inv.outstanding_amount.toFixed(2)}</td>
            </tr>
        `).join('');

        const $modal = $(`
            <div class="modal fade" id="customerSummaryModal" tabindex="-1">
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header bg-info text-white">
                    <h5 class="modal-title">Customer Summary: ${data.customer_name}</h5>
                    <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
                  </div>
                  <div class="modal-body">
                    <p><strong>Total Orders:</strong> ${data.total_orders}</p>
                    <p><strong>Outstanding Balance:</strong> ${this.currency} ${data.outstanding_balance.toFixed(2)}</p>
                    <p><strong>Last Invoice:</strong> ${data.last_invoice?.name || "N/A"} on ${data.last_invoice?.posting_date || "N/A"}</p>
                    <hr/>
                    <h6>Recent Invoices</h6>
                    <table class="table table-bordered">
                      <thead>
                        <tr><th>Invoice</th><th>Date</th><th>Total</th><th>Outstanding</th></tr>
                      </thead>
                      <tbody>${rows}</tbody>
                    </table>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" data-dismiss="modal">Close</button>
                  </div>
                </div>
              </div>
            </div>
        `);


        $('body').append($modal);
        $modal.modal('show');
        $modal.on('hidden.bs.modal', () => $modal.remove());
    } catch (err) {
        console.error("Customer summary error:", err);
        this._showError("Failed to load customer summary");
    }
}
 


    addToCart(item) {
        const key = item.item_code;
        if (!this.cart[key]) {
            this.cart[key] = { ...item, qty: 1 };
        } else {
            this.cart[key].qty++;
        }
        this.cartView.update(this.cart);
        this.itemSelector.updateBadges(this.cart);
    }

    beginCheckout() {
        if (!Object.keys(this.cart).length) {
            return frappe.msgprint('Add items before checkout');
        }
        this.isCheckoutView = true;
        this.itemSelector.hide();
        this.cartView.hideCheckoutBtn();
        this.payment.show(this.cartView.getTotals());
    }

    cancelCheckout() {
        this.isCheckoutView = false;
        this.itemSelector.show();
        this.cartView.showCheckoutBtn();
        this.payment.hide();
    }

    async completeOrder(paymentInfo) {
    const cartItems = this.cartView.serialize();
    const totals = this.cartView.getTotals();
    

    // Store the completed order details before resetting
    this.lastCompletedOrder = {
        items: {...this.cart},
        totals: {...totals}
    };
    
    // Validate payment amount matches grand total
    if (Math.abs(paymentInfo.paid - totals.grandTotal) > 0.01) { // Allow small rounding differences
        frappe.dom.unfreeze();
        this._showError(__('Payment amount must exactly match the order total'));
        return;
    }

    const itemsList = Object.keys(cartItems).map(key => ({
        name: cartItems[key].item_code || key,
        quantity: cartItems[key].qty,
        valuation_rate: cartItems[key].rate
    }));

    const payments = [{
        mode_of_payment: paymentInfo.method,
        amount: paymentInfo.paid
    }];

    frappe.dom.freeze('Processing order...');
    
    try {
        if (this.isOnline) {
            // Online mode - process immediately
            const r = await frappe.call({
                method: "whrt_whitelabel.apis.pos.create_invoice",
                args: {
                    cart: JSON.stringify(itemsList),
                    customer: this.selected_customer?.id || $('.customer-search').val() || "",
                    pos_profile: this.posProfile,
                    payments: JSON.stringify(payments),
                    taxes_and_charges: this.taxTemplate,
                    warehouse: this.warehouse
                }
            });

            frappe.dom.unfreeze();
            
            if (r.message && !r.message.error) {
    const invoiceId = typeof r.message === 'object' ? (r.message.name || r.message.invoice_id) : r.message;
    this._showSuccessMessage(invoiceId);
    this._resetAfterOrder();
} else {
    throw new Error(r.message?.error || 'Unknown error');
}

        } else {
            // Offline mode - save to pending orders
            const pendingOrder = {
                timestamp: new Date().getTime(),
                cart: itemsList,
                customer: this.selected_customer?.id || $('.customer-search').val() || "",
                pos_profile: this.posProfile,
                payments: payments,
                taxes_and_charges: this.taxTemplate,
                warehouse: this.warehouse,
                // Store totals for validation when syncing
                totals: {
                    grandTotal: totals.grandTotal,
                    netTotal: totals.netTotal,
                    taxTotal: totals.taxTotal
                }
            };

            await this._saveToDB(STORES.PENDING_ORDERS, pendingOrder);
            frappe.dom.unfreeze();
            
            this._showSuccessMessage("OFFLINE-" + new Date().toLocaleTimeString());
            this._resetAfterOrder();
            
            frappe.show_alert({
                message: __('Order saved offline and will be synced when connection is restored'),
                indicator: 'orange'
            });
        }
    } catch (error) {
        frappe.dom.unfreeze();
        this._showError(__('Order failed: {0}', [error.message]));
    }
}

async _syncPendingOrders() {
    try {
        const pendingOrders = await this._getAllFromDB(STORES.PENDING_ORDERS);
        if (pendingOrders.length === 0) return;

        frappe.dom.freeze(__('Syncing pending orders...'));
        
        for (const order of pendingOrders) {
            try {
                // Revalidate payment amounts before syncing
                const paymentTotal = order.payments.reduce((sum, p) => sum + p.amount, 0);
                if (Math.abs(paymentTotal - order.totals.grandTotal) > 0.01) {
                    console.error('Payment validation failed for pending order:', order.id);
                    continue;
                }

                const r = await frappe.call({
                    method: "whrt_whitelabel.apis.pos.create_invoice",
                    args: {
                        cart: JSON.stringify(order.cart),
                        customer: order.customer,
                        pos_profile: order.pos_profile,
                        payments: JSON.stringify(order.payments),
                        taxes_and_charges: order.taxes_and_charges,
                        warehouse: order.warehouse
                    }
                });

                if (r.message && !r.message.error) {
                    // Remove successfully synced order
                    await this._deleteFromDB(STORES.PENDING_ORDERS, order.id);
                } else {
                    console.error('Failed to sync order:', order.id, r.message?.error);
                }
            } catch (error) {
                console.error('Error syncing order:', order.id, error);
            }
        }
        
        frappe.dom.unfreeze();
        
        if (pendingOrders.length > 0) {
            frappe.show_alert({
                message: __('Synced {0} pending orders', [pendingOrders.length]),
                indicator: 'green'
            });
        }
    } catch (error) {
        console.error('Error syncing pending orders:', error);
        frappe.dom.unfreeze();
    }
}

    async _onConnectionRestored() {
        frappe.show_alert({ message: __('Connection restored'), indicator: 'green' });
        
        // Sync pending orders
        await this._syncPendingOrders();
        
        // Refresh data from server
        await this._loadItems();
        await this._loadCustomers();
    }

    // Helper methods for IndexedDB operations
    _saveToDB(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    _getFromDB(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    _getAllFromDB(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    _deleteFromDB(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    
    _showSuccessMessage(invoiceId) {
    console.log("Showing success message for:", invoiceId); // DEBUG

    const $success = $(`
        <div class="order-success animate__animated animate__fadeInDown">
            <h3>🎉 Order #${invoiceId} Completed!</h3>
            <button class="btn btn-primary btn-view-summary">View Summary</button>
            <button class="btn btn-secondary btn-print">🖨 Print Receipt</button>
            <button class="btn btn-success btn-new-order">➕ New Order</button>
        </div>
    `).css({
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#d4edda',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        textAlign: 'center',
        zIndex: 9999
    });

    $('.pos-container').append($success); // Make sure this selector exists

    $success.find('.btn-print').on('click', () => this._printReceipt(invoiceId));
    $success.find('.btn-new-order').on('click', () => {
        $success.remove();
        this._resetAfterOrder();
    });
    $success.find('.btn-view-summary').on('click', () => {
    $success.remove();
    this._showOrderSummaryModal(invoiceId);
});

}




    _resetAfterOrder() {
        this.cart = {};
        this.cartView.reset();
        this.cancelCheckout();
        this.itemSelector.updateBadges(this.cart);
    }

_showOrderSummaryModal(invoiceId) {
    if (!this.lastCompletedOrder) {
        this._showError('No order details available');
        return;
    }

    const { items, totals } = this.lastCompletedOrder;

    const rows = Object.values(items).map(item => {
        const qty = item.qty ?? 0;
        const rate = item.rate ?? item.valuation_rate ?? 0;
        const amount = qty * rate;

        return `
            <tr>
                <td>${item.item_name || item.name || 'Unnamed Item'}</td>
                <td>${qty}</td>
                <td>${this.currency} ${rate.toFixed(2)}</td>
                <td>${this.currency} ${amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const $modal = $(`
        <div class="modal fade" tabindex="-1" role="dialog" id="orderSummaryModal">
          <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
              <div class="modal-header bg-success text-white">
                <h5 class="modal-title">Order Summary - #${invoiceId}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <table class="table table-bordered">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
                <div class="text-right font-weight-bold">
                    Total: ${this.currency} ${(totals?.grandTotal ?? 0).toFixed(2)}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
    `);

    $('body').append($modal);
    $modal.modal('show');

    $modal.on('hidden.bs.modal', () => {
        $modal.remove();
    });
}

    async _printReceipt(invoiceId) {
    try {
        if (this.isOnline) {
            const r = await frappe.call({
                method: "whrt_whitelabel.apis.pos.print_receipt",
                args: { invoice_id: invoiceId }
            });

            if (r.message) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(r.message);
                printWindow.document.close();
                printWindow.print();
            }
        } else {
            // Offline receipt printing
            const printWindow = window.open('', '_blank');
            const order = this.lastCompletedOrder;
if (!order) {
    this._showError("No order data available for printing");
    return;
}

const rows = Object.values(order.items).map(item => {
    const qty = item.qty ?? 0;
    const rate = item.rate ?? item.valuation_rate ?? 0;
    const amount = qty * rate;

    return `
        <tr>
            <td>${item.item_name || item.name || 'Unnamed Item'}</td>
            <td>${qty}</td>
            <td>${this.currency} ${rate.toFixed(2)}</td>
            <td>${this.currency} ${amount.toFixed(2)}</td>
        </tr>
    `;
}).join('');


            printWindow.document.write(`
                <html>
                    <head>
                        <title>Receipt #${invoiceId}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .receipt-header { text-align: center; margin-bottom: 20px; }
                            .receipt-title { font-size: 18px; font-weight: bold; }
                            .receipt-info { margin-bottom: 15px; }
                            .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                            .receipt-table th, .receipt-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            .receipt-table th { background-color: #f2f2f2; }
                            .receipt-total { text-align: right; font-weight: bold; }
                            .receipt-footer { margin-top: 20px; text-align: center; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="receipt-header">
                            <div class="receipt-title">OFFLINE RECEIPT</div>
                            <div>#${invoiceId}</div>
                            <div>${new Date().toLocaleString()}</div>
                        </div>
                        <div class="receipt-info">
                            <div><strong>Customer:</strong> ${this.selected_customer?.name || 'Walk-in Customer'}</div>
                            <div><strong>POS Profile:</strong> ${this.posProfile}</div>
                        </div>
                        <table class="receipt-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                        <div class="receipt-total">
                            <div>Total: ${this.currency} ${(order.totals?.grandTotal ?? 0).toFixed(2)}</div>

                        </div>
                        <div class="receipt-footer">
			    <div><strong>Date:</strong> ${new Date(order.timestamp || Date.now()).toLocaleString()}</div>

                            <div>This is an offline receipt. The order will be synced when connection is restored.</div>
                            <div>Thank you for your purchase!</div>
                        </div>
                    </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.print();
        }
    } catch (error) {
        console.error("Print failed:", error);
        this._showError(__('Failed to print receipt'));
    }
}

    _logout() {
        if (Object.keys(this.cart).length > 0) {
            frappe.confirm(
                'You have items in your cart. Are you sure you want to logout?',
                () => this._performLogout(),
                'Confirm Logout'
            );
        } else {
            this._performLogout();
        }
    }

    _performLogout() {
        localStorage.removeItem('lastUsedPOSProfile');
        this.cart = {};
        this.posProfile = null;
        this.selected_customer = null;
        $(this.wrapper).empty();
        this._showProfileLogin();
    }
}

frappe.provide("pos");
pos.PointOfSale = PointOfSale;