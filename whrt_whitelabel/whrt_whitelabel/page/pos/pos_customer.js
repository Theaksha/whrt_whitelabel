// whrt_whitelabel/whrt_whitelabel/page/pos/pos_customer.js
export class CustomerSelector {
  constructor(controller) {
    this.ctrl = controller;
    this.$input = $('.customer-search');
    this.$dropdown = $('<ul class="customer-dropdown"></ul>')
                      .css({
                        position: 'absolute',
                        top: this.$input.position().top + this.$input.outerHeight(),
                        left: this.$input.position().left,
                        width: this.$input.outerWidth(),
                        'max-height': '200px',
                        overflow: 'auto',
                        padding: 0,
                        margin: 0,
                        'background-color': '#fff',
                        border: '1px solid #ccc',
                        'list-style': 'none',
                        'z-index': 1000
                      })
                      .insertAfter(this.$input)
                      .hide();

    this.customers = [];
    this._bindEvents();
    
    // Initialize with any existing selection
    if (controller.selected_customer) {
      this.$input.val(controller.selected_customer.label);
    }
  }

  load(customers) {
    if (!customers || !Array.isArray(customers)) {
      console.error("Invalid customers data", customers);
      this.customers = [];
    } else {
      this.customers = customers;
    }
    this._renderList(this.customers);
    
    // Update input if customer is already selected
    if (this.ctrl.selected_customer) {
      this.$input.val(this.ctrl.selected_customer.label);
    }
  }

  _bindEvents() {
    // Show & filter on focus/input
    this.$input.on('focus input', () => {
      this._filter(this.$input.val().trim());
      this.$dropdown.show();
    });

    // Hide on outside click
    $(document).on('click', this._handleDocumentClick.bind(this));
  }

  _handleDocumentClick(e) {
    if (!this.$dropdown.is(e.target) && 
        !this.$input.is(e.target) && 
        !$.contains(this.$dropdown[0], e.target)) {
      this.$dropdown.hide();
    }
  }

  _filter(term) {
    const filtered = this.customers.filter(c =>
      (c.customer_name || c.name).toLowerCase().includes(term.toLowerCase())
    );
    this._renderList(filtered);
  }

  _renderList(list) {
    this.$dropdown.empty();
    
    if (list.length === 0) {
      this.$dropdown.append(
        `<li style="padding:8px;color:#999;">No customers found</li>`
      );
    } else {
      list.forEach(c => {
        const label = c.customer_name || c.name;
        this.$dropdown.append(
          `<li data-id="${c.name}" style="padding:8px;cursor:pointer;">${label}</li>`
        );
      });
    }
    
    // Add "+ Add Customer" option
    this.$dropdown.append(
      `<li class="add-customer" style="padding:8px;cursor:pointer;font-weight:bold;border-top:1px solid #eee;">
         + Add Customer
       </li>`
    );

    // Bind click handlers
    this.$dropdown.find('li').on('click', e => {
      const $li = $(e.currentTarget);
      if ($li.hasClass('add-customer')) {
        this._addCustomer();
      } else {
        this._select($li.data('id'), $li.text());
      }
    });
  }

  _select(id, label) {
  const selected = this.customers.find(c => c.name === id);
  this.$input.val(label);
  this.ctrl.selected_customer = {
    id: selected?.name || id,
    name: selected?.customer_name || label,
    ...selected  // store full object for future use
  };
  this.$dropdown.hide();
}


  _addCustomer() {
    const name = this.$input.val().trim() || 'New Customer';
    frappe.call({
      method: 'frappe.client.insert',
      args: {
        doc: { doctype: 'Customer', customer_name: name }
      },
      callback: r => {
        // Add to local list and select
        this.customers.push(r.message);
        this._select(r.message.name, r.message.customer_name);
      },
      error: () => {
        frappe.msgprint('Failed to create customer');
      }
    });
  }

  destroy() {
    $(document).off('click', this._handleDocumentClick);
    this.$input.off('focus input');
    this.$dropdown.remove();
  }
}