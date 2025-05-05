// whrt_pos_session.js
import { setStorage, getStorage, removeStorage, clearStorage } from './whrt_pos_indexeddb.js';
import { fetchAndStoreDoctypeData } from './whrt_pos_data.js';

export async function showPosSelectionDialog() {
  let saved_company = await getStorage("selected_company");
  let saved_pos_profile = await getStorage("selected_pos_profile");
  let saved_opening_balance = await getStorage("opening_balance");
  if (saved_company && saved_pos_profile) {
    frappe.msgprint(`Loaded saved session: ${saved_company} - ${saved_pos_profile}`);
    window.company_selected = saved_company;
    window.pos_profile_selected = saved_pos_profile;
    if (saved_opening_balance) window.opening_balance_details = JSON.parse(saved_opening_balance);
    return;
  }
  let dialog = new frappe.ui.Dialog({
    title: "Select POS Session Details",
    fields: [
      { label: "Company", fieldname: "company", fieldtype: "Select", options: "", reqd: 1 },
      { label: "POS Profile", fieldname: "pos_profile", fieldtype: "Link", options: "POS Profile", reqd: 1 },
      {
        label: "Opening Balance Details", fieldname: "opening_balance", fieldtype: "Table", reqd: 1,
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
        method: 'whrt_whitelabel.api.create_pos_opening_entry',
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
            // Now fetch and store all required data
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
    callback: function (response) {
      let companies = response.message;
      if (companies && companies.length) {
        let company_options = companies.map(company => company.name).join("\n");
        dialog.set_df_property("company", "options", company_options);
      } else {
        frappe.msgprint("No companies found!");
      }
    }
  });
  dialog.fields_dict.company.df.onchange = function () {
    let selected_company = dialog.get_value("company");
    if (selected_company) {
      frappe.call({
        method: "whrt_whitelabel.api.get_pos_profiles",
        args: { company: selected_company },
        callback: function (response) {
          let profiles = response.message;
          let options = "";
          if (profiles && profiles.length) {
            profiles.forEach(function (profile) { options += profile.name + "\n"; });
          } else {
            options = "POS Profile";
          }
          dialog.set_df_property("pos_profile", "options", options);
        }
      });
    }
  };
  dialog.fields_dict.pos_profile.df.onchange = function () {
    let selected_profile = dialog.get_value("pos_profile");
    if (!selected_profile || selected_profile === "undefined") return;
    frappe.call({
      method: "frappe.client.get",
      args: { doctype: "POS Profile", name: selected_profile },
      callback: function (r) {
        if (!r.message) return;
        let pos_profile = r.message;
        let template_name = pos_profile.taxes_and_charges;
        let tax_category = pos_profile.tax_category;
        frappe.call({
          method: "whrt_whitelabel.api.get_sales_taxes_and_charges_details",
          args: { template_name: template_name },
          callback: function(taxRes) {
            let tax_rules = taxRes.message || [];
            let taxData = {
              taxes_and_charges: template_name,
              tax_category: tax_category,
              rules: tax_rules
            };
            setStorage("pos_profile_taxation", JSON.stringify(taxData));
            let warehouse = pos_profile.warehouse;
            setStorage("pos_profile_warehouse", warehouse);
            let payments = pos_profile.payments || [];
            let rows = [];
            payments.forEach(function (payment) { 
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
    try { entries = JSON.parse(entriesStr); } catch (e) { entries = []; }
  }
  entries.push(newEntryId);
  await setStorage("pos_opening_entries", JSON.stringify(entries));
}

export async function finalizePossession() {
  console.debug("FinalizePossession called");

  let savedCart = await getStorage('cart');
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
        method: 'whrt_whitelabel.api.create_pos_closing_entry',
        args: {
          pos_opening_entry: pos_opening_entry,
          period_end_date: periodEnd,
          posting_date: posting_date,
          posting_time: posting_time,
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
  // Remove only session-specific keys; clear cached master data as well.
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
  // Also clear the persistent image flag so that images load on next login.
  localStorage.removeItem("images_loaded_flag");
  console.debug("Cleanup complete. Reloading page.");
  frappe.msgprint("POS session closed. All data cleared.");
  window.location.reload();
}
