// whrt_pos_item_selector.js
import { getStorage } from './whrt_pos_indexeddb.js';
import { storeImageOffline, getImageOffline } from './whrt_pos_data.js';

const itemsPerPage = 24;
let currentFilteredItems = [];
let currentCategory = "";
let currentPage = 1;
const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export async function loadCategories() {
  frappe.call({
    method: 'frappe.client.get_list',
    args: { doctype: 'Item Group', fields: ['name', 'item_group_name'], limit_page_length: 1000 },
    callback: function (response) {
      const categoryList = $('#category-list');
      response.message.forEach(cat => {
        const displayName = cat.item_group_name || cat.name;
        categoryList.append(`<li class="nav-item"><a href="#" class="nav-link category" data-category="${displayName}">${displayName}</a></li>`);
      });
    }
  });
}

export async function loadProductsByCategory(category_name) {
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

async function renderPage(filteredItems = currentFilteredItems) {
  let start = (currentPage - 1) * itemsPerPage;
  let end = start + itemsPerPage;
  let pageItems = filteredItems.slice(start, end);
  await populateProductGrid(pageItems);
  addPaginationControls(Math.ceil(filteredItems.length / itemsPerPage));
}

function addPaginationControls(totalPages) {
  $('.pagination-controls').remove();
  if (totalPages <= 1) return;
  const pagination = $('<div class="pagination-controls d-flex justify-content-center mt-3"></div>');
  const prev_button = $('<button class="btn btn-outline-primary mr-2">Previous</button>');
  const next_button = $('<button class="btn btn-outline-primary">Next</button>');
  if (currentPage === 1) prev_button.prop('disabled', true);
  if (currentPage === totalPages) next_button.prop('disabled', true);
  prev_button.on('click', function () { if (currentPage > 1) { currentPage--; renderPage(); } });
  next_button.on('click', function () { if (currentPage < totalPages) { currentPage++; renderPage(); } });
  pagination.append(prev_button, next_button);
  $('.card-body').last().append(pagination);
}

async function populateProductGrid(products) {
  $('.pagination-controls').remove();
  const product_grid = $('.product-grid');
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
  const product_item = $('<div class="card product-item"></div>');
  
  // Create image element with a unique ID based on the product name
  const product_image = $(`<img class="card-img-top" id="item-image-${product.name}" alt="${product.item_name}" />`);
  
  if (!navigator.onLine) {
  console.debug("System is offline. Attempting to load offline image for product:", product.name);
  product_image.on('error', function(e) {
    console.error("Error event triggered while loading offline image for product:", product.name, e);
    console.debug("Current src attribute:", product_image.attr('src'));
  });
  product_image.on('load', function() {
    console.log("Offline image loaded successfully for product:", product.name);
  });
  
  getImageOffline(product.name)
    .then(offlineUrl => {
      if (offlineUrl) {
        console.debug("Offline URL for", product.name, ":", offlineUrl);
        product_image.attr('src', offlineUrl);
      } else {
        console.error("No offline image found for product:", product.name);
        product_image.attr('src', product.image);
      }
    })
    .catch((error) => {
      console.error("Failed to retrieve offline image for product:", product.name, error);
      product_image.attr('src', product.image);
    });
} else {
  product_image.attr('src', product.image);
  storeImageOffline(product.name, product.image)
    .catch(error => console.error("Failed to store image offline for product:", product.name, error));
}

  product_item.append(product_image);
  
  const badge_color = (typeof stock_qty === 'number' && stock_qty > 0) ? 'bg-success' : 'bg-danger';
  const badge_text  = (typeof stock_qty === 'number' && stock_qty > 0) ? stock_qty : '0';
  const stock_badge = $(`<span class="badge ${badge_color} stock-badge">${badge_text}</span>`);
  product_item.append(stock_badge);
  
  const product_info = $('<div class="card-body product-info"></div>');
  const product_name = $('<h5 class="card-title product-name"></h5>').text(product.item_name);
  product_info.append(product_name);
  const product_price = $('<p class="product-price"></p>').text(formatter.format(product.valuation_rate));
  product_item.append(product_price);
  product_item.append(product_info);
  
  // When clicked, trigger the event to add the product to the cart
  product_item.on('click', function () {
    $(document).trigger('whrt-pos:add_to_cart', [product]);
  });
  return product_item;
}

export function attachCategoryHandler() {
  $(document).on('click', '.category', function(e) {
    e.preventDefault();
    let category = $(this).data('category');
    loadProductsByCategory(category);
  });
}

export function attachSearchHandler() {
  $(document).on('input', '.product-search-input', function (e) {
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
    method: 'whrt_whitelabel.api.search_products',
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

export { renderPage };
