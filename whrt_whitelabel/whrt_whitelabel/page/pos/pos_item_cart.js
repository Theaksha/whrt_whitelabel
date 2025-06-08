// whrt_whitelabel/whrt_whitelabel/page/pos/pos_item_cart.js
export class ItemCart {
    constructor(controller) {
        this.ctrl = controller;
        this.$body = $('.cart-body');
        this.$checkoutBtn = $('.checkout-btn');
        this.$totalQty = $('.total-qty');
        this.$netTotal  = $('.net-total');
        this.$grandTotal= $('.grand-total');
        this.$discount  = $('.discount-input');

        this.$checkoutBtn.on('click', () => this.ctrl.beginCheckout());
        this.$body.on('click', '.qty-increase', e => this._changeQty(e, +1));
        this.$body.on('click', '.qty-decrease', e => this._changeQty(e, -1));
        this.$discount.on('input', () => this.update(this.ctrl.cart));
    }

    update(cart) {
        this.$body.empty();
        let totalQty = 0, net = 0;
        const getInit = name => name.split(' ')
                                    .map(w=>w[0])
                                    .join('')
                                    .substr(0,2)
                                    .toUpperCase();

        if (!Object.keys(cart).length) {
            this.$body.text('No items in cart');
        } else {
            Object.values(cart).forEach(it => {
                const amt = it.qty * it.valuation_rate;
                totalQty += it.qty;
                net += amt;

                // --- NEW IMAGE LOGIC ---
                const hasImage = it.image && it.image.trim();
                let imgHtml;
                if (hasImage) {
                    // onerror: hide broken image and append initials
                    imgHtml = `
                      <img src="${it.image}"
                           alt="${it.item_name}"
                           onerror="
                             this.style.display='none';
                             this.insertAdjacentHTML('afterend',
                               '<div class=&quot;cart-item-initials&quot;>${getInit(it.item_name)}</div>'
                             );
                           ">
                    `;
                } else {
                    imgHtml = `<div class="cart-item-initials">${getInit(it.item_name)}</div>`;
                }
                // --- END NEW IMAGE LOGIC ---

                this.$body.append(`
                    <div class="cart-item">
                      ${imgHtml}
                      <div class="cart-item-name">${it.item_name}</div>
                      <div class="cart-item-qty">
                        <button class="qty-decrease" data-code="${it.item_code}">-</button>
                        ${it.qty} ${it.stock_uom}
                        <button class="qty-increase" data-code="${it.item_code}">+</button>
                      </div>
                      <div class="cart-item-amount">${this.ctrl.currency}${amt.toFixed(2)}</div>
                    </div>
                `);
            });
        }

        const disc = parseFloat(this.$discount.val()) || 0;
        const grand = Math.max(0, net - disc);

        this.$totalQty.text(totalQty);
        this.$netTotal.text(net.toFixed(2));
        this.$grandTotal.text(grand.toFixed(2));
    }

    _changeQty(e, delta) {
        const code = $(e.currentTarget).data('code');
        const c = this.ctrl.cart[code];
        c.qty += delta;
        if (c.qty <= 0) delete this.ctrl.cart[code];
        this.update(this.ctrl.cart);
        this.ctrl.itemSelector.updateBadges(this.ctrl.cart);
    }

    getTotals() {
        return { total: parseFloat(this.$grandTotal.text()) };
    }

    serialize() {
        return Object.values(this.ctrl.cart).map(it => ({
            item_code: it.item_code,
            qty: it.qty,
            rate: it.valuation_rate,
            uom: it.stock_uom
        }));
    }

    hideCheckoutBtn() { this.$checkoutBtn.hide(); }
    showCheckoutBtn() { this.$checkoutBtn.show(); }
    reset() {
        this.$discount.val('');
        this.update({});
        this.showCheckoutBtn();
    }
}
