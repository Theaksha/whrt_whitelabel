frappe.provide("pos");

frappe.pages['pos'].on_page_load = function (wrapper) {
  frappe.ui.make_app_page({
    parent: wrapper,
    title: __("POS"),
    single_column: true,
  });

  // Optional: Hide the default Frappe navbar if you're creating a fullscreen POS
  $('header.navbar').hide();

  // Load your POS bundle
  frappe.require("new_pos.bundle.js", function () {
    // Assuming you exported your main class to `whrt_pos.PointOfSale`
    wrapper.pos = new pos.PointOfSale(wrapper);
    window.cur_pos = wrapper.pos;
  });
};
