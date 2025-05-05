// whrt_pos_controller.js
import { injectDependencies } from './whrt_pos_injector.js';
import { initIDB, getStorage } from './whrt_pos_indexeddb.js';
import { loadCategories, attachCategoryHandler, attachSearchHandler } from './whrt_pos_item_selector.js';
import { loadCartFromStorage, addToCart } from './whrt_pos_item_cart.js';
import { initializePaymentModal } from './whrt_pos_payment.js';
import { attachCustomerSearch } from './whrt_pos_customer.js';
import { showOrderSummary, initializeOrderSummaryModal } from './whrt_pos_order_summary.js';
import { showPosSelectionDialog, finalizePossession } from './whrt_pos_session.js';
import { 
    fetchAndStoreDoctypeData, 
    updateItemsIfNeeded,
    updateItemGroupsIfNeeded,
    updateCustomersIfNeeded,
    updateStockData,
    syncOfflineInvoices,
    storeAllImagesOffline 
} from './whrt_pos_data.js';
import { onPaymentSuccess } from './whrt_pos_payment.js';

export class Controller {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.initialize();
	}

	async initialize() {
		// Inject CSS/JS dependencies
		injectDependencies();

		// Build the complete POS layout
		this.wrapper.innerHTML = `
      <div class="wrapper">
        <!-- Navbar -->
        <nav class="main-header navbar navbar-expand navbar-dark">
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" data-widget="pushmenu" href="#"><i class="fas fa-bars"></i></a>
            </li>
          </ul>
          <div class="navbar-center">
            <h3 class="mb-0">WHRT POS</h3>
          </div>
          <ul class="navbar-nav ml-auto">
            <li class="nav-item">
              <a href="/home" class="btn btn-home btn-sm" style="margin-right: 5px;">Home</a>
            </li>
            <li class="nav-item">
              <button class="btn btn-info btn-sm debug-btn" style="margin-right: 5px;">Debug</button>
            </li>
            <li class="nav-item">
              <button class="btn btn-danger btn-sm logout-btn" style="color: #ffffff; margin-right: 5px;">Logout</button>
            </li>
          </ul>
        </nav>
        
        <!-- Sidebar -->
        <aside class="main-sidebar sidebar-dark-primary elevation-4">
          <a href="#" class="brand-link">
            <span class="brand-text">POS System</span>
          </a>
          <div class="sidebar">
            <nav class="mt-2">
              <ul class="nav nav-pills nav-sidebar flex-column" id="category-list" data-widget="treeview" role="menu">
                <!-- Categories will be loaded here -->
              </ul>
            </nav>
          </div>
        </aside>
        
        <!-- Content Wrapper -->
        <div class="content-wrapper">
          <section class="content pt-3">
            <div class="container-fluid">
              <div class="row">
                <!-- Main Products Column -->
                <div class="col-md-9" id="main-content">
                  <div class="card">
                    <div class="card-body">
                      <div class="product-search-bar">
                        <input type="text" class="form-control product-search-input" placeholder="Search for products...">
                        <div class="my-3 text-center">
                          <button id="store-image-btn" class="btn btn-primary">Update Images</button>
                        </div>
                      </div>
                      <div class="product-grid row"></div>
                      <div class="pagination-controls"></div>
                    </div>
                  </div>
                </div>
                <!-- Right Column: Customer Search & Item Cart -->
                <div class="col-md-3" id="right-col">
                  <div class="customer-search-bar mb-3">
                    <input type="text" class="form-control customer-search-input" placeholder="Search or add customer">
                    <button class="btn btn-info mt-2 add-customer-btn">Add New Customer</button>
                  </div>
                  <div class="card">
                    <div class="card-header"><h4>Item Cart</h4></div>
                    <div class="card-body">
                      <div class="cart-items"></div>
                      <hr>
                      <div class="cart-summary">
                        <div class="d-flex justify-content-between">
                          <span>Total Quantity:</span>
                          <span class="cart-quantity">0</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span>Net Total:</span>
                          <span>₹<span class="net-total">0.00</span></span>
                        </div>
                        <div class="tax-lines"></div>
                        <div class="d-flex justify-content-between mt-2 font-weight-bold text-primary">
                          <span>Grand Total:</span>
                          <span>₹<span class="grand-total">TBD</span></span>
                        </div>
                      </div>
                    </div>
                    <div class="card-footer text-center">
                      <button class="btn btn-success checkout-btn">Checkout</button>
                    </div>
                  </div>
                </div>
                <!-- End Right Column -->
              </div>
            </div>
          </section>
        </div>
		<!-- Progress Modal for Image Loading -->
        <div class="modal" id="image-progress-modal" tabindex="-1" role="dialog">
          <div class="modal-dialog modal-sm" role="document">
            <div class="modal-content">
              <div class="modal-body text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">Loading...</span>
                </div>
                <div class="progress mt-3">
                  <div id="progress-bar" class="progress-bar" role="progressbar" style="width: 0%;" 
                       aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

		// Bind Home button event
		$(document).on('click', '.btn-home', (e) => {
			e.preventDefault();
			window.location.href = '/desk';
		});

		// Bind Debug button event
		$(document).on('click', '.debug-btn', (e) => {
			e.preventDefault();
			console.debug("Debug button clicked!");
		});

		// Bind Logout button event to finalize session
		$(document).on('click', '.logout-btn', async (e) => {
			e.preventDefault();
			await finalizePossession();
		});
		
		// Initialize IndexedDB for offline storage FIRST so that getStorage works correctly.
		await initIDB();

		// Then show the POS session selection dialog.
		await showPosSelectionDialog();

		// After session selection, load data.
		// Check if items already exist; if so, update only changed data.
		if (await getStorage("items")) {
			await updateItemsIfNeeded();
			await updateItemGroupsIfNeeded();
			await updateCustomersIfNeeded();
			await updateStockData();
			
			
		} else {
			// First time load: fetch and store all data.
			await fetchAndStoreDoctypeData();
			await updateStockData();
			
		}

		// Load cart data
		await loadCartFromStorage();
		
		// Bind manual image update button (if needed)
		$(document).on('click', '#store-image-btn', async function () {
		  try {
			await storeAllImagesOffline();
			frappe.msgprint("Item images updated offline successfully.");
		  } catch (error) {
			frappe.msgprint("Failed to update images: " + error);
		  }
		});

		// Listen for the event to add a product to the cart
		$(document).on('whrt-pos:add_to_cart', async function (e, product) {
			console.debug("Event 'whrt-pos:add_to_cart' received with product:", product);
			// Ensure a customer is selected; fallback to "Walk-in Customer"
			await addToCart(product, window.selected_customer || "Walk-in Customer");
		});

		// Initialize Payment Modal, Order Summary Modal, and Customer Search
		initializePaymentModal();
		initializeOrderSummaryModal();
		attachCustomerSearch();

		// Bind event to open Payment Modal when checkout button is clicked
		$('.checkout-btn').on('click', function () {
			console.log("Grand Total:", $('.grand-total').text());
			$('#paymentModal').modal('show');
		});

		// Listen for payment completion globally and show order summary
		$(document).on('payment:completed', (e, invoiceId, customer, invoicedItems, totalAmount, payments) => {
			showOrderSummary(invoiceId, customer, invoicedItems, totalAmount, payments);
		});

		// Load the categories and attach event handlers
		loadCategories();
		attachCategoryHandler();
		attachSearchHandler();

		// Setup offline invoice sync on connection restore and periodically
		window.addEventListener('online', function() {
			frappe.msgprint("Connection restored. Syncing offline invoices...");
			syncOfflineInvoices
		});
		setInterval(() => {
			if (navigator.onLine) {
				syncOfflineInvoices
			}
		}, 30000);
	}
}

window.whrt_pos = window.whrt_pos || {};
window.whrt_pos.Controller = Controller;
