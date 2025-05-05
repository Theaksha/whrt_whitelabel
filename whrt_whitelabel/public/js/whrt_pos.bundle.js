// bundle.js
// Import all the POS modules so that they get bundled together.
// The main initialization for the POS page is handled by whrt_pos_controller.js.
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_injector.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_indexeddb.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_item_selector.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_item_cart.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_payment.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_customer.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_order_summary.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_session.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_data.js";
import "../../whrt_whitelabel/page/whrt_pos/whrt_pos_controller.js";

// No additional code is needed here because whrt_pos_controller.js
// registers the on_page_load handler for the "whrt-pos" page.
// Once this bundle is loaded, your POS page will initialize automatically.
