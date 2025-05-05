// whrt_pos_data.js
import { setStorage, getStorage } from './whrt_pos_indexeddb.js';
import { updateCart } from './whrt_pos_item_cart.js';

export async function fetchAllItems() {
  const limit = 1000;
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
      if (response.message.length < limit) break;
      start += limit;
    } else {
      break;
    }
  }
  return allItems;
}

export async function fetchAndStoreDoctypeData() {
  try {
    frappe.msgprint("Fetching all Items. Please wait...");
    const items = await fetchAllItems();
    frappe.msgprint(`Total items fetched: ${items.length}`);
    await setStorage("items", JSON.stringify(items));
    // Save current timestamp
    await setStorage("items_last_fetched", new Date().toISOString());
    frappe.msgprint("All items stored in IndexedDB.");
  } catch (error) {
    console.error("Error fetching items:", error);
  }
  
  // Fetch Item Groups
  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Item Group",
      fields: ["name", "item_group_name", "modified"],
      limit_page_length: 1000
    },
    callback: async function(response) {
      if (response.message) {
        await setStorage("item_groups", JSON.stringify(response.message));
        await setStorage("item_groups_last_fetched", new Date().toISOString());
        frappe.msgprint(`Item Groups stored: ${response.message.length}`);
      }
    }
  });
  
  // Fetch Customers
  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Customer",
      fields: ["name", "customer_name", "mobile_no", "modified"],
      limit_page_length: 1000
    },
    callback: async function(response) {
      if (response.message) {
        await setStorage("customers", JSON.stringify(response.message));
        await setStorage("customers_last_fetched", new Date().toISOString());
        frappe.msgprint(`Customers stored: ${response.message.length}`);
      }
    }
  });
  
  // Fetch Stock Data
  fetchStockData();
  // Optionally, fetch taxation details here and store them similarly
}

export async function updateItemsIfNeeded() {
  let localItemsStr = await getStorage("items");
  let localItems = localItemsStr ? JSON.parse(localItemsStr) : [];
  let lastFetched = await getStorage("items_last_fetched");
  
  let filters = lastFetched ? { modified: [">", lastFetched] } : {};
  let response = await frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Item",
      fields: ["name", "item_name", "item_group", "image", "valuation_rate", "modified"],
      filters: filters,
      limit_page_length: 1000
    }
  });
  
  if (response.message && response.message.length > 0) {
    response.message.forEach(newItem => {
      let index = localItems.findIndex(item => item.name === newItem.name);
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

export async function updateItemGroupsIfNeeded() {
  let localGroupsStr = await getStorage("item_groups");
  let localGroups = localGroupsStr ? JSON.parse(localGroupsStr) : [];
  let lastFetched = await getStorage("item_groups_last_fetched");
  
  let filters = lastFetched ? { modified: [">", lastFetched] } : {};
  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Item Group",
      fields: ["name", "item_group_name", "modified"],
      filters: filters,
      limit_page_length: 1000
    },
    callback: async function(response) {
      if (response.message && response.message.length > 0) {
        response.message.forEach(newGroup => {
          let index = localGroups.findIndex(group => group.name === newGroup.name);
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

export async function updateCustomersIfNeeded() {
  let localCustomersStr = await getStorage("customers");
  let localCustomers = localCustomersStr ? JSON.parse(localCustomersStr) : [];
  let lastFetched = await getStorage("customers_last_fetched");
  
  let filters = lastFetched ? { modified: [">", lastFetched] } : {};
  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "Customer",
      fields: ["name", "customer_name", "mobile_no", "modified"],
      filters: filters,
      limit_page_length: 1000
    },
    callback: async function(response) {
      if (response.message && response.message.length > 0) {
        response.message.forEach(newCustomer => {
          let index = localCustomers.findIndex(cust => cust.name === newCustomer.name);
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

export async function fetchStockData() {
  let warehouse = await getStorage("pos_profile_warehouse");
  if (!warehouse) { warehouse = "Main Warehouse"; }
  frappe.call({
    method: "whrt_whitelabel.api.get_accurate_stock",
    args: { warehouse: warehouse },
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

export async function updateStockData() {
  // For example, re-fetch stock data based on the last update time.
  await fetchStockData();
}





/*---------------------------------------------------------
  Image Storage Functions with Progress Modal
---------------------------------------------------------*/

function openImageDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("itemImagesDB", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeImageOffline(itemId, imageUrl) {
  try {
    // Construct the proxy API URL
    const encodedUrl = encodeURIComponent(imageUrl);
    const proxyUrl = `${window.location.origin}/api/method/whrt_whitelabel.api.proxy_image?url=${encodedUrl}`;
    
    const response = await fetch(proxyUrl);
    const blob = await response.blob();
	console.log("Blob type:", blob.type); // should be 'image/jpeg' or similar
    const db = await openImageDB();
    const transaction = db.transaction("images", "readwrite");
    const store = transaction.objectStore("images");
    store.put({ id: itemId, image: blob });
    console.log(`Image stored for Item ID: ${itemId}`);
  } catch (error) {
    console.error("Failed to fetch and store image:", error);
    // Rethrow if you want the online branch to catch this error.
    throw error;
  }
}

export async function getImageOffline(itemId) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openImageDB();
      const transaction = db.transaction("images", "readonly");
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

/*---------------------------------------------------------
  Function to Store All Item Images Offline via Button Only
---------------------------------------------------------*/
export async function storeAllImagesOffline() {
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

  const concurrencyLimit = 500; // Process 1000 images concurrently

  for (let i = 0; i < total; i += concurrencyLimit) {
    const batch = items.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map(async (item) => {
      await storeImageOffline(item.name, item.image);
      count++;
      const progress = Math.round((count / total) * 100);
      $("#progress-bar").css("width", `${progress}%`).attr("aria-valuenow", progress);
    }));
  }

  $("#image-progress-modal").modal("hide");
  console.log("All item images have been stored offline.");
  localStorage.setItem("images_loaded_flag", "true");
}


/*---------------------------------------------------------
  Other Offline Functions (Invoices, Stock, etc.)
---------------------------------------------------------*/

export async function storeOfflineInvoice(invoicePayload) {
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

export async function offlineReduceStock(cart) {
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
  cart.forEach(item => {
    if (stockData[item.name] !== undefined) {
      stockData[item.name] -= item.quantity;
      if (stockData[item.name] < 0) {
        stockData[item.name] = 0;
      }
    }
  });
  await setStorage("stock_mapping", JSON.stringify(stockData));
  updateCart();
}

export async function syncOfflineInvoices() {
  if (!navigator.onLine) return;
  let offlineInvoices = await getStorage("offline_invoices");
  if (!offlineInvoices) return;
  try {
    offlineInvoices = JSON.parse(offlineInvoices);
  } catch (e) {
    console.error("Error parsing offline invoices", e);
    return;
  }
  for (let i = 0; i < offlineInvoices.length; i++) {
    let invoicePayload = offlineInvoices[i];
    await frappe.call({
      method: 'whrt_whitelabel.api.create_invoice',
      args: invoicePayload,
      callback: function (invoice_response) {
        if (invoice_response.message && invoice_response.message.invoice_id) {
          frappe.msgprint("Offline invoice synced: " + invoice_response.message.invoice_id);
          offlineInvoices.splice(i, 1);
          i--;
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
