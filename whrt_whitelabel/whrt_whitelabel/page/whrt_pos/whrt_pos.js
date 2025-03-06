frappe.pages['whrt-pos'].on_page_load = async function (wrapper) {

  // ----------------------------
  // IndexedDB Helper Functions
  // ----------------------------
  let db;
  async function initIDB() {
    return new Promise((resolve, reject) => {
      let request = indexedDB.open("whrt_pos_db", 1);
      request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("storage")) {
          db.createObjectStore("storage", { keyPath: "key" });
        }
      };
      request.onsuccess = function(event) {
        db = event.target.result;
        resolve();
      };
      request.onerror = function(event) {
        console.error("IndexedDB error:", event.target.errorCode);
        reject(event.target.errorCode);
      };
    });
  }
  await initIDB();

  async function getStorage(key) {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readonly");
      let store = transaction.objectStore("storage");
      let request = store.get(key);
      request.onsuccess = function() {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  async function setStorage(key, value) {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readwrite");
      let store = transaction.objectStore("storage");
      let request = store.put({ key: key, value: value });
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  async function removeStorage(key) {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readwrite");
      let store = transaction.objectStore("storage");
      let request = store.delete(key);
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  async function clearStorage() {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readwrite");
      let store = transaction.objectStore("storage");
      let request = store.clear();
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  // ----------------------------
  // Utility: Show simple message
  // ----------------------------
  function showLoadingMessage(msg) {
    frappe.msgprint(msg);
    console.log(msg);
  }

  // ----------------------------
  // Offline Invoice Storage Function
  // ----------------------------
  async function storeOfflineInvoice(invoicePayload) {
    // Retrieve the existing offline invoices from IndexedDB (under the key "offline_invoices")
    let offlineInvoices = await getStorage("offline_invoices");
    if (offlineInvoices) {
      try {
        offlineInvoices = JSON.parse(offlineInvoices);
      } catch (e) {
        offlineInvoices = [];
      }
    } else {
      offlineInvoices = [];
    }
    // Append the new invoice payload
    offlineInvoices.push(invoicePayload);
    // Save the updated offline invoices array back to IndexedDB
    await setStorage("offline_invoices", JSON.stringify(offlineInvoices));
  }
  // Add this function along with your other helper functions (e.g., after storeOfflineInvoice)
async function offlineReduceStock(cart) {
  let stockData = await getStorage("stock_mapping");
  if (stockData) {
    try {
      stockData = JSON.parse(stockData);
    } catch (e) {
      stockData = {};
    }
  } else {
    stockData = {};
  }
  // Loop through each cart item and reduce stock
  cart.forEach(item => {
    if (stockData[item.name] !== undefined) {
      stockData[item.name] -= item.quantity;
      if (stockData[item.name] < 0) {
        stockData[item.name] = 0;
      }
    }
  });
  await setStorage("stock_mapping", JSON.stringify(stockData));
  // 1) Update the cart side
  update_cart();

  // 2) Re-render the product grid so the stock badges reflect the new counts
  //    If your code is showing a particular category, re-run the same load / render steps:
  renderPage();  // or load_products_by_category(currentCategory); 
}

  // ----------------------------
  // Offline Invoice Sync Routine
  // ----------------------------
  async function syncOfflineInvoices() {
  if (!navigator.onLine) return;
  let offlineInvoices = await getStorage("offline_invoices");
  if (!offlineInvoices) return;
  try {
    offlineInvoices = JSON.parse(offlineInvoices);
  } catch (e) {
    console.error("Error parsing offline invoices", e);
    return;
  }
  // Loop through each stored invoice and try syncing
  for (let i = 0; i < offlineInvoices.length; i++) {
    let invoicePayload = offlineInvoices[i];
    // Adjust the taxes_and_charges field if it is a JSON string
    if (invoicePayload.taxes_and_charges) {
      try {
        let taxData = JSON.parse(invoicePayload.taxes_and_charges);
        if (taxData && taxData.taxes_and_charges) {
          invoicePayload.taxes_and_charges = taxData.taxes_and_charges;
        }
      } catch (e) {
        // If parsing fails, leave the value as-is
      }
    }
    await frappe.call({
      method: 'whrt_whitelabel.api.create_invoice',
      args: invoicePayload,
      callback: function (invoice_response) {
        if (invoice_response.message && invoice_response.message.invoice_id) {
          frappe.msgprint("Offline invoice synced: " + invoice_response.message.invoice_id);
          offlineInvoices.splice(i, 1);
          i--; // adjust index after removal
        } else {
          frappe.msgprint("Failed to sync an offline invoice: " + (invoice_response.error || ""));
        }
      },
      error: function (err) {
        frappe.msgprint("Server error while syncing offline invoice.");
        console.error("Sync error", err);
      }
    });
  }
  await setStorage("offline_invoices", JSON.stringify(offlineInvoices));
}

  
  // Trigger sync when connection is restored
  window.addEventListener('online', function() {
    frappe.msgprint("Connection restored. Syncing offline invoices...");
    syncOfflineInvoices();
  });
  
  // Also sync periodically every 30 seconds
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineInvoices();
    }
  }, 30000);

  // ----------------------------
  // Fetch All Items in Batches
  // ----------------------------
  async function fetchAllItems() {
    const limit = 1000;
    let allItems = [];
    let start = 0;
    while (true) {
      let response = await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Item",
          fields: ["name", "item_name", "item_group", "image", "valuation_rate"],
          limit_page_length: limit,
          limit_start: start
        }
      });
      if (response.message && response.message.length > 0) {
        allItems = allItems.concat(response.message);
        showLoadingMessage(`Fetched ${allItems.length} items so far...`);
        if (response.message.length < limit) break;
        start += limit;
      } else {
        break;
      }
    }
    return allItems;
  }

  // ----------------------------
  // Fetch & Store Doctype Data
  // ----------------------------
  async function fetchAndStoreDoctypeData() {
    try {
      showLoadingMessage("Fetching all Items. Please wait...");
      const items = await fetchAllItems();
      showLoadingMessage(`Total items fetched: ${items.length}`);
      await setStorage("items", JSON.stringify(items));
      showLoadingMessage("All items stored in IndexedDB.");
    } catch (error) {
      console.error("Error fetching items:", error);
    }
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Item Group",
        fields: ["name", "item_group_name"],
        limit_page_length: 1000
      },
      callback: async function(response) {
        if (response.message) {
          await setStorage("item_groups", JSON.stringify(response.message));
          showLoadingMessage(`Item Groups stored: ${response.message.length}`);
        }
      }
    });
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Customer",
        fields: ["name", "customer_name", "mobile_no"],
        limit_page_length: 1000
      },
      callback: async function(response) {
        if (response.message) {
          await setStorage("customers", JSON.stringify(response.message));
          showLoadingMessage(`Customers stored: ${response.message.length}`);
        }
      }
    });
    fetchStockData();
  }

  // ----------------------------
  // Fetch Stock Data from Server
  // ----------------------------
  async function fetchStockData() {
    let warehouse = await getStorage("pos_profile_warehouse");
    if (!warehouse) {
      warehouse = "Main Warehouse";
    }
    frappe.call({
      method: "whrt_whitelabel.api.get_accurate_stock",
      args: { warehouse: warehouse },
      callback: async function(response) {
        if (response.message) {
          let stock_mapping = response.message;
          await setStorage("stock_mapping", JSON.stringify(stock_mapping));
          frappe.msgprint("Accurate stock data stored in IndexedDB!");
          update_cart();
        }
      }
    });
  }

  // ----------------------------
  // Debug: Check Items in Storage
  // ----------------------------
  async function debugItemsStorage() {
    let data = await getStorage("items");
    if (data) {
      let items = JSON.parse(data);
      console.log("Total items stored in IndexedDB:", items.length);
      alert("Total items stored in IndexedDB: " + items.length);
    } else {
      console.log("No items stored in IndexedDB.");
      alert("No items stored in IndexedDB.");
    }
  }

  $('.body-sidebar-container').hide();
  $('header.navbar').hide();
  $('.page-head').hide();
  if (!frappe.session.user || frappe.session.user === 'Guest') {
    window.location.href = '/login?redirect-to=whrt-pos';
    return;
  }

  // ----------------------------
  // Helper: Add POS Opening Entry to Array
  // ----------------------------
  async function addPosOpeningEntry(newEntryId) {
    let entriesStr = await getStorage("pos_opening_entries");
    let entries = [];
    if (entriesStr) {
      entries = JSON.parse(entriesStr);
    }
    entries.push(newEntryId);
    await setStorage("pos_opening_entries", JSON.stringify(entries));
  }

  // ----------------------------
  // Logout & POS Closing Entry Creation
  // ----------------------------
  async function finalizePosSession() {
    let savedCart = await getStorage('cart');
    if (savedCart && JSON.parse(savedCart).length > 0) {
      // Finalize pending transactions here...
    }
    let entriesStr = await getStorage("pos_opening_entries");
    let openingEntries = entriesStr ? JSON.parse(entriesStr) : [];
    if (openingEntries.length === 0) {
      frappe.msgprint("No POS Opening Entry found. Cannot create POS Closing Entry.");
      finalizeSessionCleanup();
      return;
    }
    let periodEnd = frappe.datetime.get_today() + " 23:59:59";
    let posting_date = frappe.datetime.get_today();
    let nowDate = new Date();
    let posting_time = nowDate.toTimeString().split(" ")[0];
    openingEntries.forEach(function(pos_opening_entry) {
      frappe.call({
        method: 'whrt_whitelabel.api.create_pos_closing_entry',
        args: {
          pos_opening_entry: pos_opening_entry,
          period_end_date: periodEnd,
          posting_date: posting_date,
          posting_time: posting_time,
          pos_transactions: JSON.stringify([]),
          payment_reconciliation: JSON.stringify([]),
          taxes: JSON.stringify([]),
          grand_total: "0",
          net_total: "0",
          total_quantity: "0"
        },
        callback: function(res) {
          if (res.message && res.message.closing_entry) {
            frappe.msgprint("POS Closing Entry created for " + pos_opening_entry + ": " + res.message.closing_entry);
          } else {
            frappe.msgprint("Failed to create POS Closing Entry for " + pos_opening_entry + ": " + (res.error || ""));
          }
        }
      });
    });
    finalizeSessionCleanup();
  }

  function finalizeSessionCleanup() {
    Promise.all([
      removeStorage("selected_company"),
      removeStorage("selected_pos_profile"),
      removeStorage("opening_balance"),
      removeStorage("pos_opening_entries"),
      clearStorage()
    ]).then(() => {
      frappe.msgprint("POS session closed. All data cleared.");
    });
  }

  async function setupCustomNavbar() {
    var posProfile = (await getStorage("selected_pos_profile")) || "POS Profile";
    var isLoggedIn = frappe.session.user && frappe.session.user !== 'Guest';
    var navbar = $('<div class="custom-navbar"></div>').css({
      'background': '#007bff',
      'color': '#fff',
      'padding': '10px',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      'position': 'fixed',
      'top': '0',
      'width': '100%',
      'z-index': '1100'
    });
    var userDisplay = $('<span class="user-display">POS: ' + posProfile + '</span>');
    var homeBtn = $('<button class="home-btn" style="margin: 0 10px;">Home</button>');
    var loginBtn = $('<button class="login-btn" style="margin: 0 10px;">Login</button>');
    var logoutBtn = $('<button class="logout-btn" style="margin: 0 10px;">Logout</button>');
    var debugBtn = $('<button class="debug-btn" style="margin: 0 10px;">Debug Items</button>');
    navbar.append(userDisplay, homeBtn, debugBtn, (isLoggedIn ? logoutBtn : loginBtn));
    $('body').prepend(navbar);
    homeBtn.on('click', function () { window.location.href = '/desk'; });
    loginBtn.on('click', function () { window.location.href = '/login?redirect-to=whrt-pos'; });
    debugBtn.on('click', debugItemsStorage);
    logoutBtn.on('click', async function () {
      await finalizePosSession();
    });
  }
  await setupCustomNavbar();

  // ----------------------------
  // POS Session Dialog
  // ----------------------------
  let company_selected = null;
  let pos_profile_selected = null;
  let opening_balance_details = null;
  async function show_pos_selection_dialog() {
    let saved_company = await getStorage("selected_company");
    let saved_pos_profile = await getStorage("selected_pos_profile");
    let saved_opening_balance = await getStorage("opening_balance");
    if (saved_company && saved_pos_profile) {
      frappe.msgprint(`Loaded saved session: ${saved_company} - ${saved_pos_profile}`);
      company_selected = saved_company;
      pos_profile_selected = saved_pos_profile;
      if (saved_opening_balance) opening_balance_details = JSON.parse(saved_opening_balance);
      return;
    }
    let dialog = new frappe.ui.Dialog({
      title: "Select POS Session Details",
      fields: [
        { label: "Company", fieldname: "company", fieldtype: "Select", options: "", reqd: 1 },
        { label: "POS Profile", fieldname: "pos_profile", fieldtype: "Link", options: "POS Profile", reqd: 1 },
        {
          label: "Opening Balance Details", fieldname: "opening_balance", fieldtype: "Table", reqd: 1,
          fields: [
            { label: "Mode of Payment", fieldname: "mode_of_payment", fieldtype: "Link", options: "Mode of Payment", in_list_view: 1, reqd: 1 },
            { label: "Opening Amount", fieldname: "opening_amount", fieldtype: "Currency", in_list_view: 1 }
          ]
        }
      ],
      primary_action_label: "Submit",
      primary_action: async function(values) {
        if (!values.company || !values.pos_profile) {
          frappe.msgprint("Please select both Company and POS Profile.");
          return;
        }
        await setStorage("selected_company", values.company);
        await setStorage("selected_pos_profile", values.pos_profile);
        await setStorage("opening_balance", JSON.stringify(values.opening_balance));
        company_selected = values.company;
        pos_profile_selected = values.pos_profile;
        frappe.msgprint(`Selected: ${values.company} - ${values.pos_profile}`);
        let periodStart = frappe.datetime.get_today() + " 00:00:00";
        let periodEnd = frappe.datetime.add_days(frappe.datetime.get_today(), 1) + " 00:00:00";
        frappe.call({
          method: 'whrt_whitelabel.api.create_pos_opening_entry',
          args: {
            company: values.company,
            pos_profile: values.pos_profile,
            period_start_date: periodStart,
            period_end_date: periodEnd,
            opening_balance_details: JSON.stringify(values.opening_balance)
          },
          callback: function(res) {
            if (res.message && res.message.opening_entry) {
              frappe.msgprint("POS Opening Entry created: " + res.message.opening_entry);
              addPosOpeningEntry(res.message.opening_entry);
            } else {
              frappe.msgprint("Failed to create POS Opening Entry: " + (res.error || ""));
            }
          }
        });
        await fetchAndStoreDoctypeData();
        dialog.hide();
      }
    });
    frappe.call({
      method: "frappe.client.get_list",
      args: { doctype: "Company", fields: ["name"] },
      callback: function (response) {
        let companies = response.message;
        if (companies && companies.length) {
          let company_options = companies.map(company => company.name).join("\n");
          dialog.set_df_property("company", "options", company_options);
        } else {
          frappe.msgprint("No companies found!");
        }
      }
    });
    dialog.fields_dict.company.df.onchange = function () {
      let selected_company = dialog.get_value("company");
      if (selected_company) {
        frappe.call({
          method: "whrt_whitelabel.api.get_pos_profiles",
          args: { company: selected_company },
          callback: function (response) {
            let profiles = response.message;
            let options = "";
            if (profiles && profiles.length) {
              profiles.forEach(function (profile) { options += profile.name + "\n"; });
            } else { options = "POS Profile"; }
            dialog.set_df_property("pos_profile", "options", options);
          }
        });
      }
    };
    dialog.fields_dict.pos_profile.df.onchange = function () {
      let selected_profile = dialog.get_value("pos_profile");
      if (!selected_profile || selected_profile === "undefined") return;
      frappe.call({
        method: "frappe.client.get",
        args: { doctype: "POS Profile", name: selected_profile },
        callback: function (r) {
          if (!r.message) return;
          let pos_profile = r.message;
          // Retrieve tax details from the Sales Taxes and Charges Template
          let template_name = pos_profile.taxes_and_charges; 
          let tax_category = pos_profile.tax_category;
          frappe.call({
            method: "whrt_whitelabel.api.get_sales_taxes_and_charges_details",
            args: { template_name: template_name },
            callback: function(taxRes) {
              let tax_rules = taxRes.message || [];
              // Build an object that includes the template name, tax category, and detailed tax rules
              let taxData = {
                taxes_and_charges: template_name,
                tax_category: tax_category,
                rules: tax_rules
              };
              setStorage("pos_profile_taxation", JSON.stringify(taxData));
              let warehouse = pos_profile.warehouse;
              setStorage("pos_profile_warehouse", warehouse);
              let payments = pos_profile.payments || [];
              let rows = [];
              payments.forEach(function (payment) {
                rows.push({ mode_of_payment: payment.mode_of_payment, opening_amount: 0 });
              });
              if (rows.length === 0) rows.push({ mode_of_payment: "", opening_amount: 0 });
              dialog.set_value("opening_balance", rows);
              dialog.refresh();
            }
          });
        }
      });
    };
    dialog.show();
  }
  await show_pos_selection_dialog();

  // ----------------------------
  // Client-Side Tax Calculation Routine
  // ----------------------------
  function calculateClientSideTaxes(cart, tax_rules) {
    let net_total = 0;
    cart.forEach(item => {
      net_total += item.quantity * item.valuation_rate;
    });
    let taxes = [];
    let total_taxes_and_charges = 0;
    tax_rules.forEach(rule => {
      let rate = rule.tax_rate || rule.rate || 0;
      let tax_amount = 0;
      if (rule.type === "On Net Total") {
        tax_amount = net_total * (rate / 100);
      } else {
        tax_amount = net_total * (rate / 100);
      }
      taxes.push({
        description: rule.description || rule.account_head || "Tax",
        account_head: rule.account_head,
        type: rule.type,
        tax_amount: tax_amount
      });
      total_taxes_and_charges += tax_amount;
    });
    let grand_total = net_total + total_taxes_and_charges;
    return {
      net_total: net_total,
      total_taxes_and_charges: total_taxes_and_charges,
      grand_total: grand_total,
      taxes: taxes
    };
  }

  // ----------------------------
  // (Taxation) Update Cart Function
  // ----------------------------
  async function update_cart() {
    const cartItems = cart_section.find('.cart-items');
    cartItems.empty();
    totalQuantity = 0;
    let netTotal = 0;
    cart.forEach(item => {
      totalQuantity += item.quantity;
      netTotal += item.quantity * item.valuation_rate;
      const cartItem = createCartItem(item);
      cartItems.append(cartItem);
    });
    cart_section.find('.cart-quantity').text(totalQuantity);
    cart_section.find('.net-total').text(netTotal.toFixed(2));
    cart_section.find('.tax-lines').empty();
    cart_section.find('.grand-total').text("TBD");
    await setStorage('cart', JSON.stringify(cart));

    let company = await getStorage("selected_company");
    let pos_profile_taxation = await getStorage("pos_profile_taxation");
    let customer_for_taxes = selected_customer || "Walk-in Customer";

    if (navigator.onLine && company && pos_profile_taxation && cart.length > 0) {
      frappe.call({
        method: 'whrt_whitelabel.api.calculate_taxes_for_pos_invoice',
        args: {
          cart: JSON.stringify(cart),
          company: company,
          customer: customer_for_taxes,
          taxes_and_charges: pos_profile_taxation
        },
        callback: function(r) {
          if (r && r.message) {
            cart_section.find('.net-total').text(r.message.net_total.toFixed(2));
            r.message.taxes.forEach(tax_line => {
              cart_section.find('.tax-lines').append(`
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span>${tax_line.description}</span>
                  <span>₹${(tax_line.tax_amount || 0).toFixed(2)}</span>
                </div>
              `);
            });
            cart_section.find('.grand-total').text(r.message.grand_total.toFixed(2));
          }
        }
      });
    } else if (!navigator.onLine && pos_profile_taxation && cart.length > 0) {
      let taxData = {};
      try {
        taxData = JSON.parse(pos_profile_taxation);
      } catch (e) {
        taxData = { rules: [] };
      }
      let tax_rules = taxData.rules || [];
      let taxResult = calculateClientSideTaxes(cart, tax_rules);
      cart_section.find('.net-total').text(taxResult.net_total.toFixed(2));
      taxResult.taxes.forEach(tax_line => {
        cart_section.find('.tax-lines').append(`
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${tax_line.description}</span>
            <span>₹${(tax_line.tax_amount || 0).toFixed(2)}</span>
          </div>
        `);
      });
      cart_section.find('.grand-total').text(taxResult.grand_total.toFixed(2));
    }
  }

  var page = frappe.ui.make_app_page({ parent: wrapper, single_column: true });
  var category_sidebar = $('<div class="category-sidebar"></div>').appendTo(page.wrapper).css({
    'width': '178px',
    'background-color': '#f4f4f4',
    'height': 'calc(100vh - 50px)',
    'position': 'fixed',
    'top': '50px',
    'left': '0',
    'padding': '10px 15px',
    'border-radius': '5px',
    'box-shadow': '2px 0px 5px rgba(0,0,0,0.1)',
    'overflow-y': 'auto',
    'z-index': '1000'
  });
  category_sidebar.append('<h3 class="sidebar-header">Categories</h3>');
  category_sidebar.find('.sidebar-header').css({ 'font-size': '18px', 'font-weight': 'bold', 'color': '#ff6347', 'margin-bottom': '15px', 'cursor': 'pointer' });
  var content_area = $('<div class="content-area"></div>').appendTo(page.wrapper).css({
    'padding': '20px',
    'display': 'flex',
    'flex-direction': 'column',
    'background-color': 'black',
    'align-items': 'center',
    'margin-left': '200px',
    'margin-right': '240px',
    'overflow-x': 'hidden'
  });
  content_area.append('<h2 style="color:white;">Whrt POS</h2>');
  content_area.append('<p style="color:white;">Select a category to view products</p>');
  
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
      @media (max-width: 768px) {
          .category-sidebar, .right-section {
              position: static !important;
              width: 100% !important;
              height: auto !important;
              box-shadow: none !important;
              margin: 0 !important;
          }
          .content-area {
              margin-left: 0 !important;
              margin-right: 0 !important;
          }
      }
  `;
  document.head.appendChild(styleTag);
  var product_grid = $('<div class="product-grid"></div>').appendTo(content_area).css({
    'display': 'grid',
    'grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))',
    'gap': '10px',
    'width': '100%',
    'margin-top': '20px'
  });

  let currentFilteredItems = [];
  let currentCategory = "";
  let currentPage = 1;
  const itemsPerPage = 24;
  var formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  async function buildCategorySidebarFromLocal() {
    let data = await getStorage("item_groups");
    if (!data) {
      frappe.msgprint("No offline item_groups found. Please fetch data first.");
      return;
    }
    let item_groups = JSON.parse(data);
    var menu = $('<ul></ul>').appendTo(category_sidebar).css({ 'list-style-type': 'none', 'padding': '0', 'margin': '0' });
    item_groups.forEach(function (group) {
      var list_item = $('<li><a href="#" class="item-group">' + group.item_group_name + '</a></li>');
      menu.append(list_item);
      list_item.on('click', function (e) {
        e.preventDefault();
        currentPage = 1;
        currentCategory = group.item_group_name;
        load_products_by_category(group.item_group_name);
      });
    });
    menu.find('li').css({ 'margin-bottom': '10px', 'padding': '5px 0', 'font-size': '14px' });
  }
  buildCategorySidebarFromLocal();

  async function renderPage() {
    let start = (currentPage - 1) * itemsPerPage;
    let end = start + itemsPerPage;
    let pageItems = currentFilteredItems.slice(start, end);
    await populateProductGrid(pageItems);
    addPaginationControls(Math.ceil(currentFilteredItems.length / itemsPerPage));
  }

  function addPaginationControls(totalPages) {
    $('.pagination-controls').remove();
    if (totalPages <= 1) return;
    const pagination = $('<div class="pagination-controls"></div>').css({ 'display': 'flex', 'justify-content': 'center', 'margin-top': '20px' });
    const prev_button = $('<button>Previous</button>').css({ 'margin-right': '10px' });
    const next_button = $('<button>Next</button>');
    if (currentPage === 1) prev_button.prop('disabled', true);
    if (currentPage === totalPages) next_button.prop('disabled', true);
    prev_button.on('click', function () { if (currentPage > 1) { currentPage--; renderPage(); } });
    next_button.on('click', function () { if (currentPage < totalPages) { currentPage++; renderPage(); } });
    pagination.append(prev_button, next_button);
    content_area.append(pagination);
  }

  async function load_products_by_category(category_name) {
    let data = await getStorage("items");
    if (!data) {
      frappe.msgprint("No offline items found. Please go online and fetch data first.");
      return;
    }
    let allItems = JSON.parse(data);
    currentFilteredItems = allItems.filter(it => it.item_group === category_name);
    currentCategory = category_name;
    currentPage = 1;
    renderPage();
  }

  const search_bar = $('<input type="text" placeholder="Search products..." class="search-bar">').css({
    'width': '100%',
    'padding': '10px',
    'margin-bottom': '20px',
    'border': '1px solid #ddd',
    'border-radius': '5px'
  }).appendTo(content_area);
  search_bar.on('input', async function () {
    const search_term = $(this).val().trim().toLowerCase();
    let data = await getStorage("items");
    if (!data) {
      frappe.msgprint("No offline items found for searching. Please fetch data first.");
      return;
    }
    let allItems = JSON.parse(data);
    currentFilteredItems = allItems.filter(item => {
      let combined = (item.item_name + " " + item.name).toLowerCase();
      return combined.includes(search_term);
    });
    currentPage = 1;
    renderPage();
  });

  async function populateProductGrid(products) {
    $('.pagination-controls').remove();
    product_grid.empty();
    let stock_mapping = {};
    try {
      let storedMapping = await getStorage("stock_mapping");
      if (storedMapping) stock_mapping = JSON.parse(storedMapping);
    } catch(e) {
      console.error("Error retrieving stock mapping:", e);
    }
    products.forEach(function (product) {
      const product_item = createProductItem(product, stock_mapping);
      product_grid.append(product_item);
    });
  }

  function createProductItem(product, stock_mapping) {
    let stock_qty = (stock_mapping && stock_mapping[product.name] !== undefined)
      ? stock_mapping[product.name]
      : 0;
    const product_item = $('<div class="product-item"></div>').css({
      'position': 'relative',
      'border': '1px solid #ddd',
      'border-radius': '10px',
      'padding': '15px',
      'box-shadow': '0px 4px 8px rgba(0, 0, 0, 0.1)',
      'background-color': '#fff',
      'text-align': 'center',
      'cursor': 'pointer',
      'transition': 'transform 0.3s ease',
      'display': 'flex',
      'flex-direction': 'column',
      'justify-content': 'space-between',
      'height': '350px'
    });
    product_item.hover(
      function () { $(this).css('transform', 'scale(1.05)'); },
      function () { $(this).css('transform', 'scale(1)'); }
    );
    const product_image = $('<img />')
      .attr('src', product.image)
      .attr('alt', product.item_name)
      .css({
        'width': '100%',
        'max-height': '200px',
        'object-fit': 'cover',
        'border-radius': '8px',
        'margin-bottom': '15px'
      });
    product_item.append(product_image);
    const badge_color = (typeof stock_qty === 'number' && stock_qty > 0) ? '#28a745' : '#dc3545';
    const badge_text  = (typeof stock_qty === 'number' && stock_qty > 0) ? stock_qty : '0';
    const stock_badge = $('<div class="stock-badge"></div>').css({
      'position': 'absolute',
      'top': '10px',
      'right': '10px',
      'background-color': badge_color,
      'color': '#fff',
      'font-weight': 'bold',
      'border-radius': '50%',
      'width': '36px',
      'height': '36px',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'font-size': '14px'
    }).text(badge_text);
    product_item.append(stock_badge);
    const product_info = $('<div class="product-info"></div>').css({
      'display': 'flex',
      'flex-direction': 'column',
      'justify-content': 'space-between',
      'text-align': 'center'
    });
    const product_name = $('<div class="product-name"></div>')
      .text(product.item_name)
      .css({
        'font-weight': 'bold',
        'font-size': '16px',
        'margin-bottom': '10px'
      });
    product_info.append(product_name);
    const product_price = $('<div class="product-price"></div>')
      .text(formatter.format(product.valuation_rate))
      .css({
        'color': '#f60',
        'font-size': '14px'
      });
    product_info.append(product_price);
    product_item.append(product_info);
    product_item.on('click', function () {
      add_to_cart(product);
    });
    return product_item;
  }

  var right_section = $('<div class="right-section"></div>').appendTo(page.wrapper).css({
    'width': '230px',
    'margin-right': '10px',
    'background-color': '#f9f9f9',
    'height': 'calc(100vh - 50px)',
    'position': 'fixed',
    'top': '50px',
    'right': '0',
    'padding': '20px',
    'box-shadow': '2px 0px 5px rgba(0,0,0,0.1)',
    'overflow-y': 'auto',
    'z-index': '1000'
  });
  const customer_search_bar = $(`
    <div class="customer-search-bar" style="margin-bottom: 20px;">
      <input type="text" class="customer-search-input" placeholder="Search or add customer" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
      <button class="add-customer-btn" style="width: 100%; padding: 10px; margin-top: 10px; background-color: #28a745; color: #fff; border: none; border-radius: 5px;">Add New Customer</button>
    </div>
  `).appendTo(right_section);
  var cart_section = $(`
    <div class="cart-section" style="margin-top: 20px; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <h3 style="margin-bottom: 20px; font-size: 18px; font-weight: bold;">Item Cart</h3>
      <div class="cart-items" style="margin-bottom: 20px; max-height: 320px; overflow-y: auto;"></div>
      <hr>
      <div class="cart-summary" style="margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Total Quantity:</span>
          <span class="cart-quantity">0</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Net Total:</span>
          <span>₹<span class="net-total">0.00</span></span>
        </div>
        <div class="tax-lines"></div>
        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 16px; font-weight: bold; color: #007bff;">
          <span>Grand Total:</span>
          <span>₹<span class="grand-total">TBD</span></span>
        </div>
      </div>
      <button class="checkout-btn" style="margin-top: 20px; width: 100%; padding: 10px; background-color: #007bff; color: #fff; border: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Checkout</button>
    </div>
  `);
  right_section.append(cart_section);
  let cart = [];
  let totalQuantity = 0;
  let invoice_id = null;
  let selected_customer = null;

  async function add_to_cart(product) {
    if (!selected_customer) {
      frappe.msgprint("Please select a customer before adding items to the cart.");
      return;
    }
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      product.quantity = 1;
      cart.push(product);
    }
    await update_cart();
  }

  function createCartItem(item) {
    const cartItem = $(`
      <div style="display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
        <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; margin-right: 10px; object-fit: cover; border-radius: 5px;">
        <div style="flex: 1;">
          <div style="font-weight: bold;">${item.name}</div>
          <div style="font-size: 12px; color: #555;">
            Quantity:
            <button class="decrease-quantity">-</button>
            ${item.quantity}
            <button class="increase-quantity">+</button>
          </div>
        </div>
        <div style="font-weight: bold; color: #333;">₹${(item.quantity * item.valuation_rate).toFixed(2)}</div>
        <button class="remove-item" style="margin-left: 10px; color: red;">×</button>
      </div>
    `);
    cartItem.find('.increase-quantity').on('click', async function () {
      item.quantity += 1;
      await update_cart();
    });
    cartItem.find('.decrease-quantity').on('click', async function () {
      if (item.quantity > 1) {
        item.quantity -= 1;
        await update_cart();
      }
    });
    cartItem.find('.remove-item').on('click', async function () {
      cart = cart.filter(cartItem => cartItem.name !== item.name);
      await update_cart();
    });
    return cartItem;
  }

  async function loadCartFromStorage() {
    const savedCart = await getStorage('cart');
    if (savedCart) {
      cart = JSON.parse(savedCart);
      await update_cart();
    }
  }
  await loadCartFromStorage();

  // ----------------------------
  // Payment Modal
  // ----------------------------
  const payment_modal = $(`
    <div class="payment-modal" style="
      display: none; 
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      background-color: #fff; 
      padding: 20px; 
      border-radius: 8px; 
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); 
      z-index: 10000; 
      width: 800px;
      max-width: 90%;
    ">
      <div style="display: flex; flex-wrap: wrap; gap: 20px;">
        <div class="payment-left" style="flex: 1 1 350px; display: flex; flex-direction: column; gap: 10px;">
          <h4>Payment Method</h4>
          <div class="payment-method-row" style="display: flex; align-items: center; gap: 10px;">
            <label style="width: 120px;">Cash</label>
            <input type="number" class="cash-amount" placeholder="0.00" style="flex: 1; padding: 5px;" />
          </div>
          <div class="payment-method-row" style="display: flex; align-items: center; gap: 10px;">
            <label style="width: 120px;">Credit Card</label>
            <input type="number" class="credit-card-amount" placeholder="0.00" style="flex: 1; padding: 5px;" />
          </div>
          <div class="payment-method-row" style="display: flex; align-items: center; gap: 10px;">
            <label style="width: 120px;">Mobile Payment</label>
            <input type="number" class="mobile-amount" placeholder="0.00" style="flex: 1; padding: 5px;" />
          </div>
        </div>
        <div class="payment-right" style="flex: 1 1 350px; display: flex; flex-direction: column; gap: 20px;">
          <div style="border: 1px solid #ddd; border-radius: 6px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Grand Total:</span>
              <span class="grand-total-display" style="font-weight: bold;">₹0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Paid Amount:</span>
              <span class="paid-amount-display" style="font-weight: bold;">₹0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>To Be Paid:</span>
              <span class="to-be-paid-display" style="font-weight: bold;">₹0.00</span>
            </div>
          </div>
          <div class="numpad" style="
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 10px;
          ">
            <button class="numpad-btn" data-value="1">1</button>
            <button class="numpad-btn" data-value="2">2</button>
            <button class="numpad-btn" data-value="3">3</button>
            <button class="numpad-btn" data-value="4">4</button>
            <button class="numpad-btn" data-value="5">5</button>
            <button class="numpad-btn" data-value="6">6</button>
            <button class="numpad-btn" data-value="7">7</button>
            <button class="numpad-btn" data-value="8">8</button>
            <button class="numpad-btn" data-value="9">9</button>
            <button class="numpad-btn" data-value="0">0</button>
            <button class="numpad-btn" data-value=".">.</button>
            <button class="numpad-btn" data-value="C">C</button>
          </div>
          <button class="process-payment-btn" style="
            width: 100%; 
            padding: 10px; 
            background-color: #007bff; 
            color: #fff; 
            border: none; 
            border-radius: 5px; 
            font-weight: bold;
          ">Pay</button>
          <button class="close-payment-modal-btn" style="
            width: 100%; 
            padding: 10px; 
            background-color: #dc3545; 
            color: #fff; 
            border: none; 
            border-radius: 5px;
          ">Close</button>
        </div>
      </div>
    </div>
  `).appendTo('body');

  let currentInput = null;
  payment_modal.find('.cash-amount, .credit-card-amount, .mobile-amount').on('focus', function () {
    currentInput = $(this);
  });
  payment_modal.find('.cash-amount, .credit-card-amount, .mobile-amount').on('input', function () {
    recalcPaymentTotals();
  });
  payment_modal.find('.numpad-btn').on('click', function () {
    const val = $(this).data('value');
    if (!currentInput) currentInput = payment_modal.find('.cash-amount');
    if (val === 'C') {
      currentInput.val('');
    } else {
      currentInput.val(currentInput.val() + val);
    }
    recalcPaymentTotals();
  });

  function recalcPaymentTotals() {
    const grandTotal = parseFloat(cart_section.find('.grand-total').text()) || 0;
    const cashAmt = parseFloat(payment_modal.find('.cash-amount').val()) || 0;
    const ccAmt = parseFloat(payment_modal.find('.credit-card-amount').val()) || 0;
    const mobileAmt = parseFloat(payment_modal.find('.mobile-amount').val()) || 0;
    const paidAmount = cashAmt + ccAmt + mobileAmt;
    const toBePaid = grandTotal - paidAmount;
    payment_modal.find('.paid-amount-display').text("₹" + paidAmount.toFixed(2));
    payment_modal.find('.to-be-paid-display').text("₹" + (toBePaid < 0 ? 0 : toBePaid).toFixed(2));
  }

  cart_section.find('.checkout-btn').on('click', async function () {
    const grandTotal = parseFloat(cart_section.find('.grand-total').text());
    if (grandTotal <= 0) {
      frappe.msgprint("Your cart is empty. Please add items to proceed.");
      return;
    }
    let selected_company = await getStorage("selected_company");
    let selected_pos_profile = await getStorage("selected_pos_profile");
    if (!selected_company || !selected_pos_profile) {
      frappe.msgprint("Please select a Company and POS Profile before checkout.");
      return;
    }
    payment_modal.find('.grand-total-display').text("₹" + grandTotal.toFixed(2));
    payment_modal.find('.paid-amount-display').text("₹0.00");
    payment_modal.find('.to-be-paid-display').text("₹" + grandTotal.toFixed(2));
    payment_modal.find('.cash-amount').val('');
    payment_modal.find('.credit-card-amount').val('');
    payment_modal.find('.mobile-amount').val('');
    payment_modal.show();
  });

  payment_modal.find('.process-payment-btn').on('click', function () {
    const grandTotal = parseFloat(cart_section.find('.grand-total').text()) || 0;
    const cashAmt = parseFloat(payment_modal.find('.cash-amount').val()) || 0;
    const ccAmt = parseFloat(payment_modal.find('.credit-card-amount').val()) || 0;
    const mobileAmt = parseFloat(payment_modal.find('.mobile-amount').val()) || 0;
    const totalPaid = cashAmt + ccAmt + mobileAmt;
    if (totalPaid < grandTotal) {
      frappe.msgprint("Paid amount is less than Grand Total!");
      return;
    }
    let paymentEntries = [];
    if (cashAmt > 0) paymentEntries.push({ mode_of_payment: "Cash", amount: cashAmt });
    if (ccAmt > 0) paymentEntries.push({ mode_of_payment: "Credit Card", amount: ccAmt });
    if (mobileAmt > 0) paymentEntries.push({ mode_of_payment: "Mobile Payment", amount: mobileAmt });
    
    (async function(){
      let selected_company = await getStorage("selected_company");
      let selected_pos_profile = await getStorage("selected_pos_profile");
      if (!selected_company || !selected_pos_profile) {
        frappe.msgprint("Please select a Company and POS Profile before processing payment.");
        return;
      }
      
      // pos_profile_taxation is expected to be stored as a JSON string containing an object with taxes_and_charges, tax_category, and rules.
      let taxation = await getStorage("pos_profile_taxation") || "{}"; 
      
      let invoicePayload = {
        cart: JSON.stringify(cart),
        customer: selected_customer,
        pos_profile: selected_pos_profile,
        payments: JSON.stringify(paymentEntries),
        taxes_and_charges: taxation
      };
      
      if (!navigator.onLine) {
        await storeOfflineInvoice(invoicePayload);
		// Reduce stock offline based on the cart items
        await offlineReduceStock(cart);
        frappe.msgprint("No internet connection. Invoice stored offline and stock updated locally. It will be synced when connection is restored.");
        cart = [];
        update_cart();
        payment_modal.hide();
        return;
      }
      
      frappe.call({
        method: 'whrt_whitelabel.api.create_invoice',
        args: invoicePayload,
        callback: function (invoice_response) {
          if (invoice_response.message && invoice_response.message.invoice_id) {
            payment_modal.hide();
            const invoice_data = invoice_response.message;
            invoice_id = invoice_data.invoice_id;
            showOrderCompletionModal({
              invoice_id: invoice_data.invoice_id,
              customer_name: invoice_data.customer_name,
              items: invoice_data.items,
              net_total: invoice_data.net_total,
              total_taxes_and_charges: invoice_data.total_taxes_and_charges,
              grand_total: invoice_data.grand_total,
              payments: invoice_data.payments
            });
            cart.forEach(function(item){
              if (item.name && item.quantity) {
                frappe.call({
                  method: 'whrt_whitelabel.api.reduce_stock',
                  args: { item_code: item.name, quantity: item.quantity },
                  callback: function(res) {
                    console.log("Reduced stock for", item.name, res.message);
                  }
                });
              } else {
                console.error("Invalid item in cart:", item);
              }
            });
            cart = [];
            update_cart();
            fetchStockData();
          } else {
            frappe.msgprint("Invoice creation failed. Please check logs.");
          }
        },
        error: async function (err) {
          frappe.msgprint("Server error. Attempting offline invoice storage.");
          await storeOfflineInvoice(invoicePayload);
          cart = [];
          update_cart();
          payment_modal.hide();
        }
      });
    })();
  });

  payment_modal.find('.close-payment-modal-btn').on('click', function () {
    payment_modal.hide();
  });

  const order_completion_modal = $(`
    <div class="order-completion-modal" style="
      display: none; 
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      background-color: #fff; 
      padding: 20px; 
      border-radius: 8px; 
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); 
      z-index: 10001; 
      width: 400px;
      max-width: 90%;
    ">
      <div class="invoice-summary" style="margin-bottom: 20px;">
        <h3 class="customer-name"></h3>
        <div class="invoice-id" style="color: #555;"></div>
        <div class="items-section" style="margin: 15px 0;"></div>
        <div class="totals-section" style="border-top: 1px solid #ddd; padding-top: 10px;"></div>
        <div class="payments-section" style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;"></div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="print-receipt-btn" style="padding: 10px; background-color: #ffc107; color: #fff; border: none; border-radius: 5px;">Print Receipt</button>
        <button class="email-receipt-btn" style="padding: 10px; background-color: #28a745; color: #fff; border: none; border-radius: 5px;">Email Receipt</button>
        <button class="new-order-btn" style="padding: 10px; background-color: #007bff; color: #fff; border: none; border-radius: 5px;">New Order</button>
      </div>
    </div>
  `).appendTo('body');

  function showOrderCompletionModal(data) {
    order_completion_modal.find('.customer-name').text(data.customer_name || "Walk-in-Customer");
    order_completion_modal.find('.invoice-id').text(data.invoice_id ? `Invoice: ${data.invoice_id}` : "");
    let items_html = "";
    if (data.items && data.items.length) {
      data.items.forEach(item => {
        let line_total = (item.rate || 0) * (item.actual_qty || 1);
        items_html += `
          <div style="display: flex; justify-content: space-between;">
            <span>${item.item_name} (${item.actual_qty} ${item.uom || 'Nos'})</span>
            <span>₹${line_total.toFixed(2)}</span>
          </div>
        `;
      });
    }
    order_completion_modal.find('.items-section').html(items_html);
    let totals_html = `
      <div style="display: flex; justify-content: space-between;">
        <span>Net Total</span>
        <span>₹${(data.net_total || 0).toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Total Taxes</span>
        <span>₹${(data.total_taxes_and_charges || 0).toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px;">
        <span>Grand Total</span>
        <span>₹${(data.grand_total || 0).toLocaleString()}</span>
      </div>
    `;
    order_completion_modal.find('.totals-section').html(totals_html);
    let payments_html = "";
    if (data.payments && data.payments.length) {
      data.payments.forEach(pay => {
        payments_html += `
          <div style="display: flex; justify-content: space-between;">
            <span>${pay.mode_of_payment}</span>
            <span>₹${(pay.amount).toLocaleString()}</span>
          </div>
        `;
      });
    }
    order_completion_modal.find('.payments-section').html(payments_html);
    order_completion_modal.show();
  }

  order_completion_modal.find('.print-receipt-btn').on('click', function () {
    if (!invoice_id) {
      frappe.msgprint("No invoice found.");
      return;
    }
    frappe.call({
      method: 'frappe.utils.print_format.print_html',
      args: { doctype: 'Sales Invoice', name: invoice_id, format: 'Standard' },
      callback: function (r) {
        if (r.message) {
          let print_window = window.open('', 'Print Invoice');
          print_window.document.write(r.message);
          print_window.document.close();
          print_window.print();
        }
      }
    });
  });

  order_completion_modal.find('.email-receipt-btn').on('click', function () {
    if (!invoice_id) {
      frappe.msgprint("No invoice found.");
      return;
    }
    frappe.call({
      method: 'whrt_whitelabel.api.email_invoice',
      args: { invoice_id: invoice_id },
      callback: function (response) {
        if (response.message) {
          frappe.msgprint("Invoice emailed successfully!");
        } else {
          frappe.msgprint("Failed to email invoice. Please try again.");
        }
      },
      error: function (err) {
        frappe.msgprint("An error occurred while emailing the invoice. Please check your network connection.");
      }
    });
  });

  order_completion_modal.find('.new-order-btn').on('click', function () {
    order_completion_modal.hide();
    selected_customer = null;
    cart = [];
    update_cart();
  });

  customer_search_bar.find('.customer-search-input').on('input', async function () {
    const search_term = $(this).val().trim().toLowerCase();
    if (navigator.onLine) {
      try {
        let response = await frappe.call({
          method: 'whrt_whitelabel.api.search_customers',
          args: { search_term: search_term }
        });
        if (response.message) {
          const customers = response.message;
          await setStorage("customers", JSON.stringify(customers));
          let storedOffline = await getStorage("customers");
          let combined = customers;
          if (storedOffline) {
            combined = combined.concat(JSON.parse(storedOffline));
          }
          showCustomerDropdown(combined);
          return;
        }
      } catch (error) {
        console.error("Online customer search failed:", error);
      }
    }
    let storedCustomers = await getStorage("customers");
    let storedOffline = await getStorage("customers");
    let combined = [];
    if (storedCustomers) combined = combined.concat(JSON.parse(storedCustomers));
    if (storedOffline) combined = combined.concat(JSON.parse(storedOffline));
    let filtered = combined.filter(cust => {
      let combinedStr = (cust.customer_name + " " + (cust.mobile_no || "")).toLowerCase();
      return combinedStr.includes(search_term);
    });
    if (filtered.length > 0) {
      showCustomerDropdown(filtered);
    } else {
      frappe.msgprint("No matching offline customer data found.");
    }
  });

  function showCustomerDropdown(customers) {
    const customer_dropdown = $('<div class="customer-dropdown"></div>').css({
      'position': 'absolute',
      'background': '#fff',
      'border': '1px solid #ddd',
      'width': '100%',
      'max-height': '200px',
      'overflow-y': 'auto',
      'z-index': '1000',
      'margin-top': '5px',
      'box-shadow': '0px 4px 10px rgba(0, 0, 0, 0.1)'
    });
    $('.customer-dropdown').remove();
    customers.forEach(customer => {
      const customer_option = $(`
        <div class="customer-option" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #ddd;">
          ${customer.customer_name} (${customer.mobile_no || 'No mobile number'})
        </div>
      `).on('click', function () {
        selected_customer = customer.name;
        customer_search_bar.find('.customer-search-input').val(customer.customer_name);
        customer_dropdown.remove();
      });
      customer_dropdown.append(customer_option);
    });
    customer_search_bar.append(customer_dropdown);
  }

  async function addCustomerOffline(customer_name, mobile_no) {
    try {
      let storedOffline = await getStorage("customers");
      let offlineArr = storedOffline ? JSON.parse(storedOffline) : [];
      let newCustomer = {
        name: "local_" + Date.now(),
        customer_name: customer_name,
        mobile_no: mobile_no,
        synced: false
      };
      offlineArr.push(newCustomer);
      await setStorage("customers", JSON.stringify(offlineArr));
      frappe.msgprint("Customer added offline successfully!");
      selected_customer = newCustomer.customer_name;
      customer_search_bar.find('.customer-search-input').val(newCustomer.customer_name);
    } catch (error) {
      frappe.msgprint("Error storing offline customer: " + error);
      console.error("Error storing offline customer:", error);
    }
  }

  customer_search_bar.find('.add-customer-btn').on('click', function () {
    const customer_name = customer_search_bar.find('.customer-search-input').val().trim();
    if (!customer_name) {
      frappe.msgprint("Please enter a customer name.");
      return;
    }
    frappe.prompt([
      {
        fieldname: 'mobile_no',
        label: 'Mobile No',
        fieldtype: 'Data',
        reqd: 1,
        description: 'Enter the customer mobile number.'
      }
    ], async function (values) {
      if (navigator.onLine) {
        try {
          let response = await frappe.call({
            method: 'whrt_whitelabel.api.set_customer_info',
            args: {
              doc: {
                doctype: 'Customer',
                customer_name: customer_name,
                mobile_no: values.mobile_no,
                customer_type: 'Individual',
                customer_group: 'Commercial',
                territory: 'All Territories'
              }
            }
          });
          if (response.message) {
            frappe.msgprint("Customer added successfully!");
            selected_customer = response.message.name;
          }
        } catch (error) {
          frappe.msgprint("Error adding customer: " + error);
          console.error("Error adding customer:", error);
        }
      } else {
        addCustomerOffline(customer_name, values.mobile_no);
      }
    });
  });

  // Offline invoice sync: run every 30 seconds if online.
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineInvoices();
    }
  }, 30000);

};
