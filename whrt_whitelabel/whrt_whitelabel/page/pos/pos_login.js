function renderPOSLoginPage(wrapper) {
  wrapper.innerHTML = `
    <div class="pos-login-container">
      <div class="pos-login-box">
        <h2>Login to POS</h2>

        <div class="pos-login-field">
          <label for="pos-profile">Select POS Profile</label>
          <select id="pos-profile" class="pos-profile-select">
            <option value="">-- Select Profile --</option>
          </select>
        </div>

        <button class="pos-login-btn">Login</button>
      </div>
    </div>
  `;

  // Load POS profiles
  frappe.call({
    method: "frappe.client.get_list",
    args: {
      doctype: "POS Profile",
      fields: ["name"],
      limit_page_length: 50
    },
    callback: function (r) {
      if (r.message) {
        const select = document.querySelector("#pos-profile");
        r.message.forEach(profile => {
          const opt = document.createElement("option");
          opt.value = profile.name;
          opt.innerText = profile.name;
          select.appendChild(opt);
        });
      }
    }
  });

  // Login button action
  document.querySelector(".pos-login-btn").addEventListener("click", () => {
    const profile = document.querySelector("#pos-profile").value;
    if (!profile) {
      frappe.msgprint("Please select a POS Profile");
      return;
    }

    // Save to localStorage or state & redirect
    localStorage.setItem("selected_pos_profile", profile);
    frappe.set_route("pos");
  });
}
