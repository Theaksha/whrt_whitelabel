var PosSelection = (function() {
    function init(page, callback) {
        // Check if a selection already exists in localStorage
        let saved_company = localStorage.getItem("selected_company");
        let saved_pos_profile = localStorage.getItem("selected_pos_profile");

        if (saved_company && saved_pos_profile) {
            frappe.msgprint(`Loaded saved profile: ${saved_company} - ${saved_pos_profile}`);
            callback();
        } else {
            showDialog(callback);
        }
    }

    function showDialog(callback) {
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Company",
                fields: ["name"]
            },
            callback: function(response) {
                let companies = response.message;
                if (companies.length === 0) {
                    frappe.msgprint("No companies found!");
                    return;
                }
                let company_options = companies.map(company => company.name);
                let dialog = new frappe.ui.Dialog({
                    title: "Select Company and POS Profile",
                    fields: [
                        {
                            label: "Company",
                            fieldname: "company",
                            fieldtype: "Select",
                            options: company_options,
                            reqd: 1
                        },
                        {
                            label: "POS Profile",
                            fieldname: "pos_profile",
                            fieldtype: "Select",
                            options: [],
                            reqd: 1
                        }
                    ],
                    primary_action_label: "Submit",
                    primary_action: function(values) {
                        if (!values.company || !values.pos_profile) {
                            frappe.msgprint("Please select both Company and POS Profile.");
                            return;
                        }
                        // Save selections for future sessions
                        localStorage.setItem("selected_company", values.company);
                        localStorage.setItem("selected_pos_profile", values.pos_profile);
                        frappe.msgprint(`Selected: ${values.company} - ${values.pos_profile}`);
                        dialog.hide();
                        callback();
                    }
                });

                // When a company is chosen, load its POS Profiles
                dialog.fields_dict.company.df.onchange = function() {
                    let selected_company = dialog.get_value("company");
                    if (selected_company) {
                        frappe.call({
                            method: "whrt_whitelabel.api.get_pos_profiles",
                            args: { company: selected_company },
                            callback: function(response) {
                                let profiles = response.message || [];
                                let profile_options = profiles.map(profile => profile.name);
                                dialog.set_df_property("pos_profile", "options", profile_options);
                            }
                        });
                    }
                };

                dialog.show();
            }
        });
    }

    return {
        init: init
    };
})();
