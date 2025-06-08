export class ProfileLogin {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this._checkSavedProfile();
  }

  _checkSavedProfile() {
    const savedProfile = localStorage.getItem('lastUsedPOSProfile');

    if (savedProfile) {
      frappe.call({
        method: "whrt_whitelabel.apis.pos.validate_pos_profile",
        args: { profile_name: savedProfile },
        callback: (r) => {
          if (r.message?.valid && savedProfile) {
            this.onSelect(savedProfile);
          } else {
            console.warn("Invalid saved profile. Falling back to company selection.");
            localStorage.removeItem('lastUsedPOSProfile');
            this._fetchUserCompanies();
          }
        },
        error: () => {
          console.warn("Failed to validate POS profile (possibly offline). Falling back.");
          this._fetchUserCompanies();
        }
      });
    } else {
      this._fetchUserCompanies();
    }
  }

  _fetchUserCompanies() {
    frappe.call({
      method: "whrt_whitelabel.apis.pos.get_user_companies",
      callback: (r) => {
        this.companies = r.message || [];
        if (this.companies.length === 0) {
          frappe.msgprint(__('No companies found for your user.'));
        } else if (this.companies.length === 1) {
          this.selectedCompany = this.companies[0].name;
          this._fetchCompanyProfiles();
        } else {
          this._showCompanyDialog();
        }
      },
      error: () => frappe.msgprint(__('Failed to fetch companies.'))
    });
  }

  _showCompanyDialog() {
    this.companyDialog = new frappe.ui.Dialog({
      title: __('Select Company'),
      fields: [{
        fieldtype: 'Select',
        label: __('Company'),
        fieldname: 'company',
        reqd: 1,
        options: this.companies.map(c => c.name).join('\n')
      }]
    });

    this.companyDialog.set_primary_action(__('Next'), () => {
      const vals = this.companyDialog.get_values();
      if (vals && vals.company) {
        this.selectedCompany = vals.company;
        this.companyDialog.hide();
        this._fetchCompanyProfiles();
      }
    });

    this.companyDialog.show();
  }

  _fetchCompanyProfiles() {
    frappe.call({
      method: "whrt_whitelabel.apis.pos.get_pos_profiles_for_company",
      args: { company: this.selectedCompany },
      callback: (r) => {
        this.profiles = r.message || [];
        if (this.profiles.length === 0) {
          frappe.msgprint(__('No POS Profiles found for company {0}', [this.selectedCompany]));
          localStorage.removeItem('lastUsedPOSProfile');  // important for recovery
          return;
        } else if (this.profiles.length === 1) {
          this._selectProfile(this.profiles[0].name);
        } else {
          this._showProfileDialog();
        }
      },
      error: () => frappe.msgprint(__('Failed to fetch POS Profiles.'))
    });
  }

  _showProfileDialog() {
    this.profileDialog = new frappe.ui.Dialog({
      title: __('Select POS Profile'),
      fields: [{
        fieldtype: 'Select',
        label: __('POS Profile'),
        fieldname: 'pos_profile',
        reqd: 1,
        options: this.profiles.map(p => p.name).join('\n')
      }]
    });

    this.profileDialog.set_primary_action(__('Login'), () => {
      const vals = this.profileDialog.get_values();
      if (vals && vals.pos_profile) {
        this._selectProfile(vals.pos_profile);
      }
    });

    this.profileDialog.show();
  }

  _selectProfile(profileName) {
    if (!profileName) {
      frappe.msgprint(__('Invalid POS profile selected.'));
      return;
    }

    localStorage.setItem('lastUsedPOSProfile', profileName);
    this.onSelect(profileName);
  }
}
