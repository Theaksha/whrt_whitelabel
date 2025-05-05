// whrt_pos_customer.js
import { setStorage, getStorage } from './whrt_pos_indexeddb.js';

export function attachCustomerSearch() {
  const customer_search_bar = $('.customer-search-bar');
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
          showCustomerDropdown(customers);
          return;
        }
      } catch (error) {
        console.error("Online customer search failed:", error);
      }
    }
    let storedCustomers = await getStorage("customers");
    let combined = storedCustomers ? JSON.parse(storedCustomers) : [];
    let filtered = combined.filter(cust => {
      let combinedStr = (cust.customer_name + " " + (cust.mobile_no || "")).toLowerCase();
      return combinedStr.includes(search_term);
    });
    if (filtered.length > 0) { showCustomerDropdown(filtered); }
    else { frappe.msgprint("No matching offline customer data found."); }
  });
  
  $('.customer-search-bar').find('.add-customer-btn').on('click', function () {
    const customer_name = $('.customer-search-bar').find('.customer-search-input').val().trim();
    if (!customer_name) {
      frappe.msgprint("Please enter a customer name.");
      return;
    }
    frappe.prompt([
      { fieldname: 'mobile_no', label: 'Mobile No', fieldtype: 'Data', reqd: 1, description: 'Enter the customer mobile number.' }
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
      <a class="list-group-item list-group-item-action customer-option">
        ${customer.customer_name} (${customer.mobile_no || 'No mobile number'})
      </a>
    `).on('click', function () {
      window.selected_customer = customer.name;
      $('.customer-search-bar').find('.customer-search-input').val(customer.customer_name);
      customer_dropdown.remove();
    });
    customer_dropdown.append(customer_option);
  });
  $('.customer-search-bar').append(customer_dropdown);
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
    window.selected_customer = newCustomer.name;
    $('.customer-search-bar').find('.customer-search-input').val(newCustomer.customer_name);
  } catch (error) {
    frappe.msgprint("Error storing offline customer: " + error);
    console.error("Error storing offline customer:", error);
  }
}

export { addCustomerOffline };
