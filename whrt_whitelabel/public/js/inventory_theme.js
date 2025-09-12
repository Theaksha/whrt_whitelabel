frappe.ui.toolbar.settings_menu.push({
    label: __("Switch to Inventory Theme"),
    action: () => {
        const existing = document.getElementById("custom-theme-css");
        if (existing) existing.remove();

        const link = document.createElement("link");
        link.id = "custom-theme-css";
        link.rel = "stylesheet";
        link.href = "/assets/inventory_theme/css/custom.css"; // Change path if needed
        document.head.appendChild(link);

        frappe.show_alert({ message: __("Inventory Theme Activated"), indicator: "green" });
    },
    standard: true
});

frappe.ui.toolbar.settings_menu.push({
    label: __("Revert to Default Theme"),
    action: () => {
        const existing = document.getElementById("custom-theme-css");
        if (existing) existing.remove();

        frappe.show_alert({ message: __("Default Theme Restored"), indicator: "yellow" });
    },
    standard: true
});
