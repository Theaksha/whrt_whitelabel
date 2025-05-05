frappe.provide("whrt_pos");

frappe.pages['whrt-pos'].on_page_load = function (wrapper) {
  frappe.ui.make_app_page({
    parent: wrapper,
    title: __("WHRT POS"),
    single_column: true,
  });
$('header.navbar').hide();
  // Dynamically load the bundled JS file
  frappe.require("whrt_pos.bundle.js", function () {
    wrapper.pos = new whrt_pos.Controller(wrapper);
    window.cur_pos = wrapper.pos;
  });
};