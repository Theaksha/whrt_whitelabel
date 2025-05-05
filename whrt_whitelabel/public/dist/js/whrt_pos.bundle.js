(() => {
  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_injector.js
  function injectDependencies() {
    if (!$('link[href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css"]').length) {
      $("head").append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">');
    }
    if (!$('script[src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"]').length) {
      $("head").append('<script src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"><\/script>');
    }
    if (!$('link[href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"]').length) {
      $("head").append('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">');
    }
    if (!$('script[src="https://cdnjs.cloudflare.com/ajax/libs/jquery-format/1.0/jquery.format.min.js"]').length) {
      $("head").append('<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-format/1.0/jquery.format.min.js"><\/script>');
    }
    if (!$('script[src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"]').length) {
      $("head").append('<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"><\/script>');
    }
    if (!$('script[src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"]').length) {
      $("head").append('<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"><\/script>');
    }
    if (!$('link[href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap"]').length) {
      $("head").append('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap" rel="stylesheet">');
    }
    if (!$('link[href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"]').length) {
      $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">');
    }
    if (!$("style#custom-pos-style").length) {
      $("head").append(`
      <style id="custom-pos-style">
        /* Global Reset & Fonts */
        body, html {
          font-family: 'Roboto', sans-serif;
          background-color: #f7f9fc;
        }
        .wrapper { background-color: #f7f9fc; }
        /* Navbar styling */
        .main-header.navbar {
          background: linear-gradient(135deg, #0a2342, #013a70);
          border-bottom: none;
          padding: 0.5rem 1rem;
        }
        .main-header .nav-link, .main-header .navbar-brand {
          color: #ffffff !important;
        }
        .navbar-center {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Montserrat', sans-serif;
        }
        .navbar-center h3 {
          margin: 0;
          font-weight: 500;
          font-size: 1.75rem;
          color: #ffffff;
        }
        /* Sidebar Toggle styling */
        .main-header .nav-link[data-widget="pushmenu"] {
          color: #ffffff !important;
          font-size: 1.5rem;
          background-color: transparent;
          padding: 0.2rem;
          margin-top: 5px;
        }
        .navbar-nav.ml-auto li { margin-left: 0.75rem; }
        /* Sidebar styling */
        .main-sidebar {
          background-color: #0a2342;
          box-shadow: 2px 0 8px rgba(0,0,0,0.2);
		  
        }
        .main-sidebar .brand-link {
          background-color: #0a2342;
          border-bottom: 1px solid #013a70;
          font-size: 1.2rem;
          font-weight: 500;
          text-align: center;
        }
        .main-sidebar .nav-sidebar .nav-link {
          color: #cfd8dc;
          padding: 0.75rem 1rem;
          margin: 0.25rem 0;
          border-radius: 4px;
          transition: background-color 0.2s, color 0.2s;
        }
        .main-sidebar .nav-sidebar .nav-link:hover, 
        .main-sidebar .nav-sidebar .nav-link.active {
          background-color: #013a70;
          color: #ffffff;
        }
		.sidebar {
  max-height: 100vh; /* Limit height to viewport */
  overflow-y: auto;  /* Enable vertical scrolling */
}


        /* Card and Product Grid styling */
        .card {
          border: none;
          border-radius: 8px;
          background-color: #ffffff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          margin-bottom: 1rem;
        }
        .card-header {
          background-color: transparent;
          border-bottom: none;
        }
        .card-body { background-color: #ffffff; }
		.product-search-bar {
  margin-bottom: 20px;
}

.product-search-input {
  width: 50%;
  padding: 10px;
  font-size: 16px;
}

        .product-grid {		  
		  display: grid;
		  grid-template-columns: repeat(4, 1fr);
		  gap: 1rem;   
          background-color: #e8eff7;
          padding: 1rem;
          border-radius: 8px;
		  height: 700px;       /* Set a fixed height for scrolling */
		  overflow-y: auto;    /* Enables vertical scrolling when needed */
        }
        .product-item {
  position: relative; /* Ensure absolute-positioned children (like the badge) can be placed correctly */
  width: 100%;
  height: 250px;
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid #d1e3f0;
  border-radius: 8px;
  position: relative;
  transition: transform 0.2s;
}

.stock-badge {
  position: absolute;
  top: 8px;    /* Adjust as needed */
  right: 8px;  /* Adjust as needed */
  z-index: 5;  /* Ensure it stays on top of the image */
  font-size: 0.8rem; 
  padding: 5px 8px;
  border-radius: 12px;
  color: #fff;
}

        .product-item:hover { transform: translateY(-5px); }
        .product-item .card-img-top {
          object-fit: cover;
          height: 60%;
          width: 100%;
        }
        .product-item .product-info {
          padding: 0.75rem;
        }
        .product-item .product-name {
          font-size: 1rem;
          font-weight: 500;
          color: #013a70;
        }
        /* Price tag: positioned near the bottom with minimal gap */
        .product-item .product-price {
          position: absolute;          
          right: 0.5rem;
          font-size: 1rem;
          font-weight: bold;
          color: darkorange;
        }
		
        /* Item Cart heading style */
        .card-header h4 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
        }
        /* Cart item styles */
        .cart-item {
          font-family: 'Roboto', sans-serif;
        }
        .cart-item .cart-item-name { font-size: 0.9rem; font-weight: 500; }
        .cart-item .cart-item-qty { 
          font-size: 0.85rem; 
          display: flex; 
          align-items: center; 
        }
        .cart-item .cart-item-qty button { 
          padding: 0.05rem 0.1rem; 
          font-size: 0.6rem; 
          margin: 0 0.2rem; 
        }
        .cart-item-divider { 
          margin: 0.5rem 0; 
          border-top: 1px solid #e0e0e0; 
        }
        /* Button styles */
        .btn-home {
          background-color: #f0ad4e;
          border-color: #f0ad4e;
          color: #ffffff;
        }
        .btn-home:hover {
          background-color: #ec971f;
          border-color: #d58512;
        }
        /* Modal / Payment Block styling */
        .modal-header, .modal-footer {
          background-color: #013a70;
          color: #ffffff;
        }
        .modal-content { 
          border-radius: 8px; 
          border: none;
        }
        .modal-body {
          background-color: #e8eff7;
          padding: 1.5rem;
        }
        .numpad .btn {
          width: 60px;
          height: 60px;
          font-size: 1.2rem;
          margin: 0.3rem;
        }
        /* Customer dropdown styling */
        .customer-dropdown {
          border-radius: 4px;
        }
      </style>
    `);
    }
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_indexeddb.js
  var db = null;
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
      let request = store.put({ key, value });
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

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_item_cart.js
  var cart = [];
  var totalQuantity = 0;
  function calculateClientSideTaxes(cart2, tax_rules) {
    let net_total = 0;
    cart2.forEach((item) => {
      net_total += item.quantity * item.valuation_rate;
    });
    let taxes = [];
    let total_taxes_and_charges = 0;
    tax_rules.forEach((rule) => {
      let rate = rule.tax_rate || rule.rate || 0;
      let tax_amount = net_total * (rate / 100);
      taxes.push({
        description: rule.description || rule.account_head || "Tax",
        account_head: rule.account_head,
        type: rule.type,
        tax_amount
      });
      total_taxes_and_charges += tax_amount;
    });
    let grand_total = net_total + total_taxes_and_charges;
    return { net_total, total_taxes_and_charges, grand_total, taxes };
  }
  async function loadCartFromStorage() {
    const savedCart = await getStorage("cart");
    if (savedCart) {
      cart = JSON.parse(savedCart);
      await updateCart();
    }
  }
  async function addToCart(product, selected_customer2) {
    if (!selected_customer2) {
      frappe.msgprint("Please select a customer before adding items to the cart.");
      return;
    }
    const existingItem = cart.find((item) => item.name === product.name);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      product.quantity = 1;
      cart.push(product);
    }
    await updateCart();
  }
  async function updateCart() {
    const cartItems = $(".cart-items");
    cartItems.empty();
    totalQuantity = 0;
    let netTotal = 0;
    cart.forEach((item) => {
      totalQuantity += item.quantity;
      netTotal += item.quantity * item.valuation_rate;
      const cartItem = createCartItem(item);
      cartItems.append(cartItem);
    });
    $(".cart-quantity").text(totalQuantity);
    $(".net-total").text(netTotal.toFixed(2));
    $(".tax-lines").empty();
    $(".grand-total").text(netTotal.toFixed(2));
    await setStorage("cart", JSON.stringify(cart));
    let company = await getStorage("selected_company");
    let pos_profile_taxation = await getStorage("pos_profile_taxation");
    let customer_for_taxes = window.selected_customer || "Walk-in Customer";
    if (navigator.onLine && company && pos_profile_taxation && cart.length > 0) {
      frappe.call({
        method: "whrt_whitelabel.api.calculate_taxes_for_pos_invoice",
        args: {
          cart: JSON.stringify(cart),
          company,
          customer: customer_for_taxes,
          taxes_and_charges: pos_profile_taxation
        },
        callback: function(r) {
          if (r && r.message) {
            $(".net-total").text(r.message.net_total.toFixed(2));
            r.message.taxes.forEach((tax_line) => {
              $(".tax-lines").append(`<div class="tax-line"><span>${tax_line.description}</span><span>\u20B9${(tax_line.tax_amount || 0).toFixed(2)}</span></div>`);
            });
            $(".grand-total").text(r.message.grand_total.toFixed(2));
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
      $(".net-total").text(taxResult.net_total.toFixed(2));
      taxResult.taxes.forEach((tax_line) => {
        $(".tax-lines").append(`<div class="tax-line"><span>${tax_line.description}</span><span>\u20B9${(tax_line.tax_amount || 0).toFixed(2)}</span></div>`);
      });
      $(".grand-total").text(taxResult.grand_total.toFixed(2));
    }
  }
  function createCartItem(item) {
    const cartItem = $(`
    <div class="cart-item d-flex align-items-center mb-2">
      <img src="${item.image}" alt="${item.name}" class="img-thumbnail mr-2" style="width:50px;">
      <div class="flex-grow-1">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-qty">
          <button class="btn btn-sm btn-outline-secondary decrease-quantity">\u2013</button>
          <span>${item.quantity}</span>
          <button class="btn btn-sm btn-outline-secondary increase-quantity">+</button>
        </div>
      </div>
      <div class="cart-item-total ml-2">\u20B9${(item.quantity * item.valuation_rate).toFixed(2)}</div>
      <button class="btn btn-sm btn-danger remove-item ml-2">\xD7</button>
    </div>
  `);
    cartItem.find(".increase-quantity").on("click", async function() {
      item.quantity += 1;
      await updateCart();
    });
    cartItem.find(".decrease-quantity").on("click", async function() {
      if (item.quantity > 1) {
        item.quantity -= 1;
        await updateCart();
      }
    });
    cartItem.find(".remove-item").on("click", async function() {
      cart = cart.filter((cartItem2) => cartItem2.name !== item.name);
      await updateCart();
    });
    return cartItem;
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_data.js
  async function fetchAllItems() {
    const limit = 1e3;
    let allItems = [];
    let start = 0;
    while (true) {
      let response = await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Item",
          fields: ["name", "item_name", "item_group", "image", "valuation_rate", "modified"],
          limit_page_length: limit,
          limit_start: start
        }
      });
      if (response.message && response.message.length > 0) {
        allItems = allItems.concat(response.message);
        frappe.msgprint(`Fetched ${allItems.length} items so far...`);
        if (response.message.length < limit)
          break;
        start += limit;
      } else {
        break;
      }
    }
    return allItems;
  }
  async function fetchAndStoreDoctypeData() {
    try {
      frappe.msgprint("Fetching all Items. Please wait...");
      const items = await fetchAllItems();
      frappe.msgprint(`Total items fetched: ${items.length}`);
      await setStorage("items", JSON.stringify(items));
      await setStorage("items_last_fetched", new Date().toISOString());
      frappe.msgprint("All items stored in IndexedDB.");
    } catch (error) {
      console.error("Error fetching items:", error);
    }
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Item Group",
        fields: ["name", "item_group_name", "modified"],
        limit_page_length: 1e3
      },
      callback: async function(response) {
        if (response.message) {
          await setStorage("item_groups", JSON.stringify(response.message));
          await setStorage("item_groups_last_fetched", new Date().toISOString());
          frappe.msgprint(`Item Groups stored: ${response.message.length}`);
        }
      }
    });
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Customer",
        fields: ["name", "customer_name", "mobile_no", "modified"],
        limit_page_length: 1e3
      },
      callback: async function(response) {
        if (response.message) {
          await setStorage("customers", JSON.stringify(response.message));
          await setStorage("customers_last_fetched", new Date().toISOString());
          frappe.msgprint(`Customers stored: ${response.message.length}`);
        }
      }
    });
    fetchStockData();
  }
  async function updateItemsIfNeeded() {
    let localItemsStr = await getStorage("items");
    let localItems = localItemsStr ? JSON.parse(localItemsStr) : [];
    let lastFetched = await getStorage("items_last_fetched");
    let filters = lastFetched ? { modified: [">", lastFetched] } : {};
    let response = await frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Item",
        fields: ["name", "item_name", "item_group", "image", "valuation_rate", "modified"],
        filters,
        limit_page_length: 1e3
      }
    });
    if (response.message && response.message.length > 0) {
      response.message.forEach((newItem) => {
        let index = localItems.findIndex((item) => item.name === newItem.name);
        if (index > -1) {
          localItems[index] = newItem;
        } else {
          localItems.push(newItem);
        }
      });
      await setStorage("items", JSON.stringify(localItems));
      await setStorage("items_last_fetched", new Date().toISOString());
      frappe.msgprint(`Items updated: ${response.message.length} changes.`);
    }
  }
  async function updateItemGroupsIfNeeded() {
    let localGroupsStr = await getStorage("item_groups");
    let localGroups = localGroupsStr ? JSON.parse(localGroupsStr) : [];
    let lastFetched = await getStorage("item_groups_last_fetched");
    let filters = lastFetched ? { modified: [">", lastFetched] } : {};
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Item Group",
        fields: ["name", "item_group_name", "modified"],
        filters,
        limit_page_length: 1e3
      },
      callback: async function(response) {
        if (response.message && response.message.length > 0) {
          response.message.forEach((newGroup) => {
            let index = localGroups.findIndex((group) => group.name === newGroup.name);
            if (index > -1) {
              localGroups[index] = newGroup;
            } else {
              localGroups.push(newGroup);
            }
          });
          await setStorage("item_groups", JSON.stringify(localGroups));
          await setStorage("item_groups_last_fetched", new Date().toISOString());
          frappe.msgprint(`Item Groups updated: ${response.message.length} changes.`);
        }
      }
    });
  }
  async function updateCustomersIfNeeded() {
    let localCustomersStr = await getStorage("customers");
    let localCustomers = localCustomersStr ? JSON.parse(localCustomersStr) : [];
    let lastFetched = await getStorage("customers_last_fetched");
    let filters = lastFetched ? { modified: [">", lastFetched] } : {};
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Customer",
        fields: ["name", "customer_name", "mobile_no", "modified"],
        filters,
        limit_page_length: 1e3
      },
      callback: async function(response) {
        if (response.message && response.message.length > 0) {
          response.message.forEach((newCustomer) => {
            let index = localCustomers.findIndex((cust) => cust.name === newCustomer.name);
            if (index > -1) {
              localCustomers[index] = newCustomer;
            } else {
              localCustomers.push(newCustomer);
            }
          });
          await setStorage("customers", JSON.stringify(localCustomers));
          await setStorage("customers_last_fetched", new Date().toISOString());
          frappe.msgprint(`Customers updated: ${response.message.length} changes.`);
        }
      }
    });
  }
  async function fetchStockData() {
    let warehouse = await getStorage("pos_profile_warehouse");
    if (!warehouse) {
      warehouse = "Main Warehouse";
    }
    frappe.call({
      method: "whrt_whitelabel.api.get_accurate_stock",
      args: { warehouse },
      callback: async function(response) {
        if (response.message) {
          let stock_mapping = response.message;
          await setStorage("stock_mapping", JSON.stringify(stock_mapping));
          await setStorage("stock_last_fetched", new Date().toISOString());
          frappe.msgprint("Accurate stock data stored in IndexedDB!");
          updateCart();
        }
      }
    });
  }
  async function updateStockData() {
    await fetchStockData();
  }
  function openImageDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("itemImagesDB", 1);
      request.onupgradeneeded = (event) => {
        const db2 = event.target.result;
        if (!db2.objectStoreNames.contains("images")) {
          db2.createObjectStore("images", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function storeImageOffline(itemId, imageUrl) {
    try {
      const encodedUrl = encodeURIComponent(imageUrl);
      const proxyUrl = `${window.location.origin}/api/method/whrt_whitelabel.api.proxy_image?url=${encodedUrl}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      console.log("Blob type:", blob.type);
      const db2 = await openImageDB();
      const transaction = db2.transaction("images", "readwrite");
      const store = transaction.objectStore("images");
      store.put({ id: itemId, image: blob });
      console.log(`Image stored for Item ID: ${itemId}`);
    } catch (error) {
      console.error("Failed to fetch and store image:", error);
      throw error;
    }
  }
  async function getImageOffline(itemId) {
    return new Promise(async (resolve, reject) => {
      try {
        const db2 = await openImageDB();
        const transaction = db2.transaction("images", "readonly");
        const store = transaction.objectStore("images");
        const request = store.get(itemId);
        request.onsuccess = () => {
          if (request.result) {
            resolve(URL.createObjectURL(request.result.image));
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  async function storeAllImagesOffline() {
    if (localStorage.getItem("images_loaded_flag") === "true") {
      console.log("Images already loaded offline.");
      return;
    }
    const itemsStr = await getStorage("items");
    if (!itemsStr) {
      console.warn("No items found to store images offline.");
      return;
    }
    const items = JSON.parse(itemsStr);
    const total = items.length;
    let count = 0;
    $("#image-progress-modal").modal("show");
    $("#progress-bar").css("width", "0%").attr("aria-valuenow", 0);
    const concurrencyLimit = 500;
    for (let i = 0; i < total; i += concurrencyLimit) {
      const batch = items.slice(i, i + concurrencyLimit);
      await Promise.all(batch.map(async (item) => {
        await storeImageOffline(item.name, item.image);
        count++;
        const progress = Math.round(count / total * 100);
        $("#progress-bar").css("width", `${progress}%`).attr("aria-valuenow", progress);
      }));
    }
    $("#image-progress-modal").modal("hide");
    console.log("All item images have been stored offline.");
    localStorage.setItem("images_loaded_flag", "true");
  }
  async function storeOfflineInvoice(invoicePayload) {
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
    offlineInvoices.push(invoicePayload);
    await setStorage("offline_invoices", JSON.stringify(offlineInvoices));
  }
  async function offlineReduceStock(cart2) {
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
    cart2.forEach((item) => {
      if (stockData[item.name] !== void 0) {
        stockData[item.name] -= item.quantity;
        if (stockData[item.name] < 0) {
          stockData[item.name] = 0;
        }
      }
    });
    await setStorage("stock_mapping", JSON.stringify(stockData));
    updateCart();
  }
  async function syncOfflineInvoices() {
    if (!navigator.onLine)
      return;
    let offlineInvoices = await getStorage("offline_invoices");
    if (!offlineInvoices)
      return;
    try {
      offlineInvoices = JSON.parse(offlineInvoices);
    } catch (e) {
      console.error("Error parsing offline invoices", e);
      return;
    }
    for (let i = 0; i < offlineInvoices.length; i++) {
      let invoicePayload = offlineInvoices[i];
      await frappe.call({
        method: "whrt_whitelabel.api.create_invoice",
        args: invoicePayload,
        callback: function(invoice_response) {
          if (invoice_response.message && invoice_response.message.invoice_id) {
            frappe.msgprint("Offline invoice synced: " + invoice_response.message.invoice_id);
            offlineInvoices.splice(i, 1);
            i--;
          } else {
            frappe.msgprint("Failed to sync an offline invoice: " + (invoice_response.error || ""));
          }
        },
        error: function(err) {
          frappe.msgprint("Server error while syncing offline invoice.");
          console.error("Sync error", err);
        }
      });
    }
    await setStorage("offline_invoices", JSON.stringify(offlineInvoices));
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_item_selector.js
  var itemsPerPage = 24;
  var currentFilteredItems = [];
  var currentCategory = "";
  var currentPage = 1;
  var formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
  async function loadCategories() {
    frappe.call({
      method: "frappe.client.get_list",
      args: { doctype: "Item Group", fields: ["name", "item_group_name"], limit_page_length: 1e3 },
      callback: function(response) {
        const categoryList = $("#category-list");
        response.message.forEach((cat) => {
          const displayName = cat.item_group_name || cat.name;
          categoryList.append(`<li class="nav-item"><a href="#" class="nav-link category" data-category="${displayName}">${displayName}</a></li>`);
        });
      }
    });
  }
  async function loadProductsByCategory(category_name) {
    let data = await getStorage("items");
    if (!data) {
      frappe.msgprint("No offline items found. Please go online and fetch data first.");
      return;
    }
    let allItems = JSON.parse(data);
    currentFilteredItems = allItems.filter((it) => it.item_group === category_name);
    currentCategory = category_name;
    currentPage = 1;
    renderPage();
  }
  async function renderPage(filteredItems = currentFilteredItems) {
    let start = (currentPage - 1) * itemsPerPage;
    let end = start + itemsPerPage;
    let pageItems = filteredItems.slice(start, end);
    await populateProductGrid(pageItems);
    addPaginationControls(Math.ceil(filteredItems.length / itemsPerPage));
  }
  function addPaginationControls(totalPages) {
    $(".pagination-controls").remove();
    if (totalPages <= 1)
      return;
    const pagination = $('<div class="pagination-controls d-flex justify-content-center mt-3"></div>');
    const prev_button = $('<button class="btn btn-outline-primary mr-2">Previous</button>');
    const next_button = $('<button class="btn btn-outline-primary">Next</button>');
    if (currentPage === 1)
      prev_button.prop("disabled", true);
    if (currentPage === totalPages)
      next_button.prop("disabled", true);
    prev_button.on("click", function() {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
      }
    });
    next_button.on("click", function() {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage();
      }
    });
    pagination.append(prev_button, next_button);
    $(".card-body").last().append(pagination);
  }
  async function populateProductGrid(products) {
    $(".pagination-controls").remove();
    const product_grid = $(".product-grid");
    product_grid.empty();
    let stock_mapping = {};
    try {
      let storedMapping = await getStorage("stock_mapping");
      if (storedMapping)
        stock_mapping = JSON.parse(storedMapping);
    } catch (e) {
      console.error("Error retrieving stock mapping:", e);
    }
    products.forEach(function(product) {
      const product_item = createProductItem(product, stock_mapping);
      product_grid.append(product_item);
    });
  }
  function createProductItem(product, stock_mapping) {
    let stock_qty = stock_mapping && stock_mapping[product.name] !== void 0 ? stock_mapping[product.name] : 0;
    const product_item = $('<div class="card product-item"></div>');
    const product_image = $(`<img class="card-img-top" id="item-image-${product.name}" alt="${product.item_name}" />`);
    if (!navigator.onLine) {
      console.debug("System is offline. Attempting to load offline image for product:", product.name);
      product_image.on("error", function(e) {
        console.error("Error event triggered while loading offline image for product:", product.name, e);
        console.debug("Current src attribute:", product_image.attr("src"));
      });
      product_image.on("load", function() {
        console.log("Offline image loaded successfully for product:", product.name);
      });
      getImageOffline(product.name).then((offlineUrl) => {
        if (offlineUrl) {
          console.debug("Offline URL for", product.name, ":", offlineUrl);
          product_image.attr("src", offlineUrl);
        } else {
          console.error("No offline image found for product:", product.name);
          product_image.attr("src", product.image);
        }
      }).catch((error) => {
        console.error("Failed to retrieve offline image for product:", product.name, error);
        product_image.attr("src", product.image);
      });
    } else {
      product_image.attr("src", product.image);
      storeImageOffline(product.name, product.image).catch((error) => console.error("Failed to store image offline for product:", product.name, error));
    }
    product_item.append(product_image);
    const badge_color = typeof stock_qty === "number" && stock_qty > 0 ? "bg-success" : "bg-danger";
    const badge_text = typeof stock_qty === "number" && stock_qty > 0 ? stock_qty : "0";
    const stock_badge = $(`<span class="badge ${badge_color} stock-badge">${badge_text}</span>`);
    product_item.append(stock_badge);
    const product_info = $('<div class="card-body product-info"></div>');
    const product_name = $('<h5 class="card-title product-name"></h5>').text(product.item_name);
    product_info.append(product_name);
    const product_price = $('<p class="product-price"></p>').text(formatter.format(product.valuation_rate));
    product_item.append(product_price);
    product_item.append(product_info);
    product_item.on("click", function() {
      $(document).trigger("whrt-pos:add_to_cart", [product]);
    });
    return product_item;
  }
  function attachCategoryHandler() {
    $(document).on("click", ".category", function(e) {
      e.preventDefault();
      let category = $(this).data("category");
      loadProductsByCategory(category);
    });
  }
  function attachSearchHandler() {
    $(document).on("input", ".product-search-input", function(e) {
      let searchQuery = $(this).val().toLowerCase();
      if (!searchQuery) {
        loadProductsByCategory(currentCategory);
      } else {
        searchProducts(searchQuery);
      }
    });
  }
  function searchProducts(searchQuery) {
    frappe.call({
      method: "whrt_whitelabel.api.search_products",
      args: { search_term: searchQuery },
      callback: function(response) {
        if (response.message) {
          const filteredProducts = response.message;
          renderPage(filteredProducts);
        } else {
          console.error("No products found for the search term:", searchQuery);
        }
      },
      error: function(err) {
        console.error("Error while fetching products:", err);
      }
    });
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_order_summary.js
  var invoice_id;
  var selected_customer;
  function showOrderSummary(invoiceId, customer, cartItems, totalAmount, payments) {
    invoice_id = invoiceId;
    selected_customer = customer || "Walk-in Customer";
    const orderSummary = {
      invoiceId,
      customer: selected_customer,
      cartItems,
      totalAmount,
      payments
    };
    localStorage.setItem("last_order_summary", JSON.stringify(orderSummary));
    $("#orderCompletionModal .customer-name").text(selected_customer);
    $("#orderCompletionModal .invoice-id").html(`<strong>Invoice ID:</strong> ${invoiceId}`);
    let itemsHtml = `<table class="table table-striped">
    <thead>
      <tr>
        <th>Item</th>
        <th>Image</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>`;
    cartItems.forEach((item) => {
      itemsHtml += `<tr>
      <td>${item.item_name}</td>
      <td><img src="${item.image}" alt="Item Image" width="50" height="50"></td>
      <td>${item.quantity}</td>
      <td>\u20B9${item.valuation_rate}</td>
    </tr>`;
    });
    itemsHtml += `</tbody></table>`;
    $("#orderCompletionModal .items-section").html(itemsHtml);
    $("#orderCompletionModal .totals-section").html(`<h4>Total: \u20B9${parseFloat(totalAmount).toFixed(2)}</h4>`);
    let paymentsHtml = `<ul class="list-group">`;
    payments.forEach((payment) => {
      paymentsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
      ${payment.mode_of_payment}
      <span>\u20B9${parseFloat(payment.amount).toFixed(2)}</span>
    </li>`;
    });
    paymentsHtml += `</ul>`;
    $("#orderCompletionModal .payments-section").html(paymentsHtml);
    $("#orderCompletionModal").modal("show");
  }
  function initializeOrderSummaryModal() {
    const orderCompletionModalHtml = `
    <div class="modal fade" tabindex="-1" role="dialog" id="orderCompletionModal">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Order Summary</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <h3 class="customer-name"></h3>
            <div class="invoice-id"></div>
            <hr>
            <div class="items-section"></div>
            <hr>
            <div class="totals-section"></div>
            <hr>
            <div class="payments-section"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary print-receipt-btn">Print Receipt</button>
            <button class="btn btn-info email-receipt-btn">Email Receipt</button>
            <button class="btn btn-secondary new-order-btn" data-dismiss="modal">New Order</button>
            <button class="btn btn-warning view-last-order-btn">View Last Order</button>
          </div>
        </div>
      </div>
    </div>
  `;
    $("body").append(orderCompletionModalHtml);
    $("#orderCompletionModal").find(".print-receipt-btn").on("click", function() {
      if (!window.invoice_id) {
        frappe.msgprint("No invoice found.");
        return;
      }
      printReceipt();
    });
    $("#orderCompletionModal").find(".email-receipt-btn").on("click", function() {
      if (!window.invoice_id) {
        frappe.msgprint("No invoice found.");
        return;
      }
      frappe.call({
        method: "whrt_whitelabel.api.email_invoice",
        args: { invoice_id },
        callback: function(response) {
          if (response.message) {
            frappe.msgprint("Invoice emailed successfully!");
          } else {
            frappe.msgprint("Failed to email invoice. Please try again.");
          }
        },
        error: function(err) {
          frappe.msgprint("An error occurred while emailing the invoice.");
        }
      });
    });
    $("#orderCompletionModal").find(".new-order-btn").on("click", function() {
      $("#orderCompletionModal").modal("hide");
      selected_customer = null;
    });
    $("#orderCompletionModal").find(".view-last-order-btn").on("click", function() {
      viewLastOrderSummary();
    });
  }
  function viewLastOrderSummary() {
    const lastOrderSummary = localStorage.getItem("last_order_summary");
    if (!lastOrderSummary) {
      frappe.msgprint("No previous order summary found.");
      return;
    }
    const { invoiceId, customer, cartItems, totalAmount, payments } = JSON.parse(lastOrderSummary);
    $("#orderCompletionModal .customer-name").text(customer);
    $("#orderCompletionModal .invoice-id").html(`<strong>Invoice ID:</strong> ${invoiceId}`);
    let itemsHtml = `<table class="table table-striped">
    <thead>
      <tr>
        <th>Item</th>
        <th>Image</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>`;
    cartItems.forEach((item) => {
      itemsHtml += `<tr>
      <td>${item.item_name}</td>
      <td><img src="${item.image}" alt="Item Image" width="50" height="50"></td>
      <td>${item.quantity}</td>
      <td>\u20B9${item.valuation_rate}</td>
    </tr>`;
    });
    itemsHtml += `</tbody></table>`;
    $("#orderCompletionModal .items-section").html(itemsHtml);
    $("#orderCompletionModal .totals-section").html(`<h4>Total: \u20B9${parseFloat(totalAmount).toFixed(2)}</h4>`);
    let paymentsHtml = `<ul class="list-group">`;
    payments.forEach((payment) => {
      paymentsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
      ${payment.mode_of_payment}
      <span>\u20B9${parseFloat(payment.amount).toFixed(2)}</span>
    </li>`;
    });
    paymentsHtml += `</ul>`;
    $("#orderCompletionModal .payments-section").html(paymentsHtml);
    $("#orderCompletionModal").modal("show");
  }
  function printReceipt() {
    const doctype = "POS Invoice";
    const print_format = "POS Invoice";
    const letter_head = "null";
    const language = frappe.boot.lang || "en";
    frappe.utils.print(doctype, window.invoice_id, print_format, letter_head, language);
    console.debug("Print function called for invoice:", window.invoice_id);
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_payment.js
  function initializePaymentModal() {
    const paymentModalHtml = `
    <div class="modal fade" id="paymentModal" tabindex="-1" role="dialog" aria-labelledby="paymentModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="paymentModalLabel">Payment</h5>
            <button type="button" class="close close-payment-modal-btn" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Left side: Payment Methods -->
              <div class="col-md-6">
                <h4>Payment Method</h4>
                ${renderPaymentMethods()}
              </div>
              <!-- Right side: Payment Summary & Numpad -->
              <div class="col-md-6">
                <div class="payment-summary mb-3">
                  <div class="d-flex justify-content-between">
                    <span>Grand Total:</span>
                    <span class="grand-total-display">\u20B90.00</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Paid Amount:</span>
                    <span class="paid-amount-display">\u20B90.00</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>To Be Paid:</span>
                    <span class="to-be-paid-display">\u20B90.00</span>
                  </div>
                </div>
                <div class="numpad d-flex flex-wrap">
                  ${renderNumpadButtons()}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary process-payment-btn">Pay</button>
            <button type="button" class="btn btn-secondary close-payment-modal-btn" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
    $("body").append(paymentModalHtml);
    let currentInput = null;
    $("#paymentModal").find(".payment-method-input").on("focus", function() {
      currentInput = $(this);
    });
    $("#paymentModal").find(".payment-method-input").on("input", function() {
      recalcPaymentTotals();
    });
    $("#paymentModal").find(".numpad-btn").on("click", function() {
      const val = $(this).data("value");
      if (!currentInput || currentInput.length === 0) {
        currentInput = $("#paymentModal").find(".cash-amount");
      }
      if (val === "C") {
        currentInput.val("");
      } else {
        currentInput.val(currentInput.val() + val);
      }
      recalcPaymentTotals();
    });
    $("#paymentModal").find(".process-payment-btn").on("click", function() {
      processPayment();
    });
    $("#paymentModal").find(".close-payment-modal-btn").on("click", function() {
      $("#paymentModal").modal("hide");
    });
  }
  function renderPaymentMethods() {
    return `
    <div class="payment-method-row d-flex align-items-center mb-2">
      <label style="width: 120px;">Cash</label>
      <input type="number" class="form-control payment-method-input cash-amount" placeholder="0.00" />
    </div>
    <div class="payment-method-row d-flex align-items-center mb-2">
      <label style="width: 120px;">Credit Card</label>
      <input type="number" class="form-control payment-method-input credit-card-amount" placeholder="0.00" />
    </div>
    <div class="payment-method-row d-flex align-items-center mb-2">
      <label style="width: 120px;">Mobile Payment</label>
      <input type="number" class="form-control payment-method-input mobile-amount" placeholder="0.00" />
    </div>
  `;
  }
  function renderNumpadButtons() {
    const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, ".", "C"];
    return buttons.map((btn) => `<button class="btn btn-secondary numpad-btn m-1" data-value="${btn}">${btn}</button>`).join("");
  }
  function recalcPaymentTotals() {
    const grandTotal = parseFloat($(".grand-total").text().replace("\u20B9", "")) || 0;
    const cashAmt = parseFloat($("#paymentModal").find(".cash-amount").val()) || 0;
    const ccAmt = parseFloat($("#paymentModal").find(".credit-card-amount").val()) || 0;
    const mobileAmt = parseFloat($("#paymentModal").find(".mobile-amount").val()) || 0;
    const paidAmount = cashAmt + ccAmt + mobileAmt;
    const toBePaid = grandTotal - paidAmount;
    $("#paymentModal").find(".paid-amount-display").text("\u20B9" + paidAmount.toFixed(2));
    $("#paymentModal").find(".to-be-paid-display").text("\u20B9" + (toBePaid < 0 ? 0 : toBePaid).toFixed(2));
  }
  async function processPayment() {
    const grandTotal = parseFloat($(".grand-total").text().replace("\u20B9", "")) || 0;
    const cashAmt = parseFloat($("#paymentModal").find(".cash-amount").val()) || 0;
    const ccAmt = parseFloat($("#paymentModal").find(".credit-card-amount").val()) || 0;
    const mobileAmt = parseFloat($("#paymentModal").find(".mobile-amount").val()) || 0;
    const totalPaid = cashAmt + ccAmt + mobileAmt;
    if (totalPaid < grandTotal) {
      frappe.msgprint("Paid amount is less than Grand Total!");
      return;
    }
    let paymentEntries = [];
    if (cashAmt > 0)
      paymentEntries.push({ mode_of_payment: "Cash", amount: cashAmt });
    if (ccAmt > 0)
      paymentEntries.push({ mode_of_payment: "Credit Card", amount: ccAmt });
    if (mobileAmt > 0)
      paymentEntries.push({ mode_of_payment: "Mobile Payment", amount: mobileAmt });
    let selected_company = await getStorage("selected_company");
    let selected_pos_profile = await getStorage("selected_pos_profile");
    if (!selected_company || !selected_pos_profile) {
      frappe.msgprint("Please select a Company and POS Profile before processing payment.");
      return;
    }
    let taxation = await getStorage("pos_profile_taxation") || "{}";
    let invoicePayload = {
      cart: JSON.stringify(cart),
      customer: window.selected_customer || "Walk-in Customer",
      pos_profile: selected_pos_profile,
      payments: JSON.stringify(paymentEntries),
      taxes_and_charges: taxation
    };
    if (!navigator.onLine) {
      frappe.msgprint("No internet connection. Invoice stored offline and stock updated locally.");
      await storeOfflineInvoice(invoicePayload);
      await offlineReduceStock(cart);
      const offlineInvoiceId = "OFF-" + new Date().getTime();
      invoicePayload.temp_id = offlineInvoiceId;
      showOrderSummary(offlineInvoiceId, invoicePayload.customer, JSON.parse(invoicePayload.cart), grandTotal, paymentEntries);
      cart.length = 0;
      updateCart();
      $("#paymentModal").modal("hide");
      return;
    }
    frappe.call({
      method: "whrt_whitelabel.api.create_invoice",
      args: invoicePayload,
      callback: function(invoice_response) {
        if (invoice_response.message && invoice_response.message.invoice_id) {
          const invoice_data = invoice_response.message;
          window.invoice_id = invoice_data.invoice_id;
          cart.forEach(function(item) {
            if (item.name && item.quantity) {
              frappe.call({
                method: "whrt_whitelabel.api.reduce_stock",
                args: { item_code: item.name, quantity: item.quantity },
                callback: function(res) {
                  console.log("Reduced stock for", item.name);
                }
              });
            }
          });
          let invoicedItems = JSON.parse(invoicePayload.cart);
          cart.length = 0;
          updateCart();
          frappe.msgprint("Invoice created successfully! Invoice ID: " + window.invoice_id);
          showOrderSummary(window.invoice_id, invoicePayload.customer, invoicedItems, grandTotal, paymentEntries);
        } else {
          frappe.msgprint("Invoice creation failed. Please check logs.");
        }
        $("#paymentModal").modal("hide");
      },
      error: async function(err) {
        frappe.msgprint("Server error. Attempting offline invoice storage.");
        await storeOfflineInvoice(invoicePayload);
        await offlineReduceStock(cart);
        cart.length = 0;
        updateCart();
        $("#paymentModal").modal("hide");
      }
    });
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_customer.js
  function attachCustomerSearch() {
    const customer_search_bar = $(".customer-search-bar");
    customer_search_bar.find(".customer-search-input").on("input", async function() {
      const search_term = $(this).val().trim().toLowerCase();
      if (navigator.onLine) {
        try {
          let response = await frappe.call({
            method: "whrt_whitelabel.api.search_customers",
            args: { search_term }
          });
          if (response.message) {
            const customers = response.message;
            await setStorage("customers", JSON.stringify(customers));
            showCustomerDropdown(customers);
            return;
          }
        } catch (error) {
          console.error("Online customer search failed:", error);
        }
      }
      let storedCustomers = await getStorage("customers");
      let combined = storedCustomers ? JSON.parse(storedCustomers) : [];
      let filtered = combined.filter((cust) => {
        let combinedStr = (cust.customer_name + " " + (cust.mobile_no || "")).toLowerCase();
        return combinedStr.includes(search_term);
      });
      if (filtered.length > 0) {
        showCustomerDropdown(filtered);
      } else {
        frappe.msgprint("No matching offline customer data found.");
      }
    });
    $(".customer-search-bar").find(".add-customer-btn").on("click", function() {
      const customer_name = $(".customer-search-bar").find(".customer-search-input").val().trim();
      if (!customer_name) {
        frappe.msgprint("Please enter a customer name.");
        return;
      }
      frappe.prompt([
        { fieldname: "mobile_no", label: "Mobile No", fieldtype: "Data", reqd: 1, description: "Enter the customer mobile number." }
      ], async function(values) {
        if (navigator.onLine) {
          try {
            let response = await frappe.call({
              method: "whrt_whitelabel.api.set_customer_info",
              args: {
                doc: {
                  doctype: "Customer",
                  customer_name,
                  mobile_no: values.mobile_no,
                  customer_type: "Individual",
                  customer_group: "Commercial",
                  territory: "All Territories"
                }
              }
            });
            if (response.message) {
              frappe.msgprint("Customer added successfully!");
              window.selected_customer = response.message.name;
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
  }
  function showCustomerDropdown(customers) {
    const customer_dropdown = $('<div class="customer-dropdown list-group"></div>').css({
      "position": "absolute",
      "background": "#fff",
      "border": "1px solid #ddd",
      "width": "100%",
      "max-height": "200px",
      "overflow-y": "auto",
      "z-index": "1000",
      "margin-top": "5px",
      "box-shadow": "0px 4px 10px rgba(0, 0, 0, 0.1)"
    });
    $(".customer-dropdown").remove();
    customers.forEach((customer) => {
      const customer_option = $(`
      <a class="list-group-item list-group-item-action customer-option">
        ${customer.customer_name} (${customer.mobile_no || "No mobile number"})
      </a>
    `).on("click", function() {
        window.selected_customer = customer.name;
        $(".customer-search-bar").find(".customer-search-input").val(customer.customer_name);
        customer_dropdown.remove();
      });
      customer_dropdown.append(customer_option);
    });
    $(".customer-search-bar").append(customer_dropdown);
  }
  async function addCustomerOffline(customer_name, mobile_no) {
    try {
      let storedOffline = await getStorage("customers");
      let offlineArr = storedOffline ? JSON.parse(storedOffline) : [];
      let newCustomer = {
        name: "local_" + Date.now(),
        customer_name,
        mobile_no,
        synced: false
      };
      offlineArr.push(newCustomer);
      await setStorage("customers", JSON.stringify(offlineArr));
      frappe.msgprint("Customer added offline successfully!");
      window.selected_customer = newCustomer.name;
      $(".customer-search-bar").find(".customer-search-input").val(newCustomer.customer_name);
    } catch (error) {
      frappe.msgprint("Error storing offline customer: " + error);
      console.error("Error storing offline customer:", error);
    }
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_session.js
  async function showPosSelectionDialog() {
    let saved_company = await getStorage("selected_company");
    let saved_pos_profile = await getStorage("selected_pos_profile");
    let saved_opening_balance = await getStorage("opening_balance");
    if (saved_company && saved_pos_profile) {
      frappe.msgprint(`Loaded saved session: ${saved_company} - ${saved_pos_profile}`);
      window.company_selected = saved_company;
      window.pos_profile_selected = saved_pos_profile;
      if (saved_opening_balance)
        window.opening_balance_details = JSON.parse(saved_opening_balance);
      return;
    }
    let dialog = new frappe.ui.Dialog({
      title: "Select POS Session Details",
      fields: [
        { label: "Company", fieldname: "company", fieldtype: "Select", options: "", reqd: 1 },
        { label: "POS Profile", fieldname: "pos_profile", fieldtype: "Link", options: "POS Profile", reqd: 1 },
        {
          label: "Opening Balance Details",
          fieldname: "opening_balance",
          fieldtype: "Table",
          reqd: 1,
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
        window.company_selected = values.company;
        window.pos_profile_selected = values.pos_profile;
        frappe.msgprint(`Selected: ${values.company} - ${values.pos_profile}`);
        let periodStart = frappe.datetime.get_today() + " 00:00:00";
        let periodEnd = frappe.datetime.add_days(frappe.datetime.get_today(), 1) + " 00:00:00";
        frappe.call({
          method: "whrt_whitelabel.api.create_pos_opening_entry",
          args: {
            company: values.company,
            pos_profile: values.pos_profile,
            period_start_date: periodStart,
            period_end_date: periodEnd,
            opening_balance_details: JSON.stringify(values.opening_balance)
          },
          callback: async function(res) {
            if (res.message && res.message.opening_entry) {
              frappe.msgprint("POS Opening Entry created: " + res.message.opening_entry);
              await addPosOpeningEntry(res.message.opening_entry);
              frappe.msgprint("Loading POS data... This may take a moment.");
              await fetchAndStoreDoctypeData();
              frappe.msgprint("POS is ready to use!");
            } else {
              frappe.msgprint("Failed to create POS Opening Entry: " + (res.error || ""));
            }
          }
        });
        dialog.hide();
      }
    });
    frappe.call({
      method: "frappe.client.get_list",
      args: { doctype: "Company", fields: ["name"] },
      callback: function(response) {
        let companies = response.message;
        if (companies && companies.length) {
          let company_options = companies.map((company) => company.name).join("\n");
          dialog.set_df_property("company", "options", company_options);
        } else {
          frappe.msgprint("No companies found!");
        }
      }
    });
    dialog.fields_dict.company.df.onchange = function() {
      let selected_company = dialog.get_value("company");
      if (selected_company) {
        frappe.call({
          method: "whrt_whitelabel.api.get_pos_profiles",
          args: { company: selected_company },
          callback: function(response) {
            let profiles = response.message;
            let options = "";
            if (profiles && profiles.length) {
              profiles.forEach(function(profile) {
                options += profile.name + "\n";
              });
            } else {
              options = "POS Profile";
            }
            dialog.set_df_property("pos_profile", "options", options);
          }
        });
      }
    };
    dialog.fields_dict.pos_profile.df.onchange = function() {
      let selected_profile = dialog.get_value("pos_profile");
      if (!selected_profile || selected_profile === "undefined")
        return;
      frappe.call({
        method: "frappe.client.get",
        args: { doctype: "POS Profile", name: selected_profile },
        callback: function(r) {
          if (!r.message)
            return;
          let pos_profile = r.message;
          let template_name = pos_profile.taxes_and_charges;
          let tax_category = pos_profile.tax_category;
          frappe.call({
            method: "whrt_whitelabel.api.get_sales_taxes_and_charges_details",
            args: { template_name },
            callback: function(taxRes) {
              let tax_rules = taxRes.message || [];
              let taxData = {
                taxes_and_charges: template_name,
                tax_category,
                rules: tax_rules
              };
              setStorage("pos_profile_taxation", JSON.stringify(taxData));
              let warehouse = pos_profile.warehouse;
              setStorage("pos_profile_warehouse", warehouse);
              let payments = pos_profile.payments || [];
              let rows = [];
              payments.forEach(function(payment) {
                rows.push({ mode_of_payment: payment.mode_of_payment, opening_amount: 0 });
              });
              if (rows.length === 0) {
                rows.push({ mode_of_payment: "Cash", opening_amount: 0 });
                rows.push({ mode_of_payment: "Credit Card", opening_amount: 0 });
                rows.push({ mode_of_payment: "Mobile Payment", opening_amount: 0 });
              }
              dialog.set_value("opening_balance", rows);
              dialog.refresh();
            }
          });
        }
      });
    };
    dialog.show();
  }
  async function addPosOpeningEntry(newEntryId) {
    let entriesStr = await getStorage("pos_opening_entries");
    let entries = [];
    if (entriesStr) {
      try {
        entries = JSON.parse(entriesStr);
      } catch (e) {
        entries = [];
      }
    }
    entries.push(newEntryId);
    await setStorage("pos_opening_entries", JSON.stringify(entries));
  }
  async function finalizePossession() {
    console.debug("FinalizePossession called");
    let savedCart = await getStorage("cart");
    console.debug("Saved cart:", savedCart);
    if (savedCart && JSON.parse(savedCart).length > 0) {
      console.debug("There are pending cart items. Finalizing transactions...");
    }
    let entriesStr = await getStorage("pos_opening_entries");
    console.debug("pos_opening_entries from storage:", entriesStr);
    let openingEntries = entriesStr ? JSON.parse(entriesStr) : [];
    if (openingEntries.length === 0) {
      frappe.msgprint("No POS Opening Entry found. Cannot create POS Closing Entry.");
      await finalizeSessionCleanup();
      return;
    }
    let periodEnd = frappe.datetime.get_today() + " 23:59:59";
    let posting_date = frappe.datetime.get_today();
    let nowDate = new Date();
    let posting_time = nowDate.toTimeString().split(" ")[0];
    console.debug("Closing parameters - periodEnd:", periodEnd, "posting_date:", posting_date, "posting_time:", posting_time);
    for (const pos_opening_entry of openingEntries) {
      console.debug("Creating closing entry for opening entry:", pos_opening_entry);
      await new Promise((resolve, reject) => {
        frappe.call({
          method: "whrt_whitelabel.api.create_pos_closing_entry",
          args: {
            pos_opening_entry,
            period_end_date: periodEnd,
            posting_date,
            posting_time,
            pos_transactions: "[]",
            payment_reconciliation: "[]",
            taxes: "[]",
            grand_total: "0",
            net_total: "0",
            total_quantity: "0"
          },
          callback: function(res) {
            console.debug("Response for closing entry of", pos_opening_entry, ":", res);
            if (res.message && res.message.closing_entry) {
              frappe.msgprint("POS Closing Entry created for " + pos_opening_entry + ": " + res.message.closing_entry);
            } else {
              frappe.msgprint("Failed to create POS Closing Entry for " + pos_opening_entry + ": " + (res.error || ""));
            }
            resolve();
          },
          error: function(err) {
            frappe.msgprint("Error while creating POS Closing Entry: " + err);
            reject(err);
          }
        });
      });
    }
    await finalizeSessionCleanup();
  }
  async function finalizeSessionCleanup() {
    console.debug("Finalizing session cleanup: removing stored session data...");
    await Promise.all([
      removeStorage("selected_company"),
      removeStorage("selected_pos_profile"),
      removeStorage("opening_balance"),
      removeStorage("pos_opening_entries"),
      removeStorage("items"),
      removeStorage("items_last_fetched"),
      removeStorage("item_groups"),
      removeStorage("item_groups_last_fetched"),
      removeStorage("customers"),
      removeStorage("customers_last_fetched"),
      removeStorage("stock_mapping"),
      removeStorage("stock_last_fetched"),
      removeStorage("pos_profile_taxation")
    ]);
    localStorage.removeItem("images_loaded_flag");
    console.debug("Cleanup complete. Reloading page.");
    frappe.msgprint("POS session closed. All data cleared.");
    window.location.reload();
  }

  // ../whrt_whitelabel/whrt_whitelabel/whrt_whitelabel/page/whrt_pos/whrt_pos_controller.js
  var Controller = class {
    constructor(wrapper) {
      this.wrapper = wrapper;
      this.initialize();
    }
    async initialize() {
      injectDependencies();
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
                          <span>\u20B9<span class="net-total">0.00</span></span>
                        </div>
                        <div class="tax-lines"></div>
                        <div class="d-flex justify-content-between mt-2 font-weight-bold text-primary">
                          <span>Grand Total:</span>
                          <span>\u20B9<span class="grand-total">TBD</span></span>
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
      $(document).on("click", ".btn-home", (e) => {
        e.preventDefault();
        window.location.href = "/desk";
      });
      $(document).on("click", ".debug-btn", (e) => {
        e.preventDefault();
        console.debug("Debug button clicked!");
      });
      $(document).on("click", ".logout-btn", async (e) => {
        e.preventDefault();
        await finalizePossession();
      });
      await initIDB();
      await showPosSelectionDialog();
      if (await getStorage("items")) {
        await updateItemsIfNeeded();
        await updateItemGroupsIfNeeded();
        await updateCustomersIfNeeded();
        await updateStockData();
      } else {
        await fetchAndStoreDoctypeData();
        await updateStockData();
      }
      await loadCartFromStorage();
      $(document).on("click", "#store-image-btn", async function() {
        try {
          await storeAllImagesOffline();
          frappe.msgprint("Item images updated offline successfully.");
        } catch (error) {
          frappe.msgprint("Failed to update images: " + error);
        }
      });
      $(document).on("whrt-pos:add_to_cart", async function(e, product) {
        console.debug("Event 'whrt-pos:add_to_cart' received with product:", product);
        await addToCart(product, window.selected_customer || "Walk-in Customer");
      });
      initializePaymentModal();
      initializeOrderSummaryModal();
      attachCustomerSearch();
      $(".checkout-btn").on("click", function() {
        console.log("Grand Total:", $(".grand-total").text());
        $("#paymentModal").modal("show");
      });
      $(document).on("payment:completed", (e, invoiceId, customer, invoicedItems, totalAmount, payments) => {
        showOrderSummary(invoiceId, customer, invoicedItems, totalAmount, payments);
      });
      loadCategories();
      attachCategoryHandler();
      attachSearchHandler();
      window.addEventListener("online", function() {
        frappe.msgprint("Connection restored. Syncing offline invoices...");
        syncOfflineInvoices;
      });
      setInterval(() => {
        if (navigator.onLine) {
          syncOfflineInvoices;
        }
      }, 3e4);
    }
  };
  window.whrt_pos = window.whrt_pos || {};
  window.whrt_pos.Controller = Controller;
})();
//# sourceMappingURL=whrt_pos.bundle.LWTKGCIG.js.map
