// Copyright (c) 2024, WhiteRaysTechnology and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Whitelabel Setting", {
// 	refresh(frm) {

// 	},
// });
// Copyright (c) 2024, WhiteRaysTechnology and contributors
// For license information, please see license.txt

frappe.ui.form.on('Whitelabel Setting', {
	after_save: function(frm) {
		frappe.ui.toolbar.clear_cache();
	}
});
