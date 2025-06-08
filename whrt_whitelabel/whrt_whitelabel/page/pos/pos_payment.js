// whrt_whitelabel/whrt_whitelabel/page/pos/pos_payment.js
export class PaymentPanel {
    constructor(controller) {
        this.ctrl = controller;
        this.$panel = $('.pos-payment');
        this.$opts  = $('.payment-option');
        this.$paid  = $('.paid-amount');
        this.$change= $('.change-amount');
        this._bind();
    }

    _bind() {
        this.$opts.on('click', e => {
            this.$opts.removeClass('active');
            $(e.currentTarget).addClass('active');
        });
        $('.complete-order-btn').on('click', () => {
            const method = this.$opts.filter('.active').data('method');
            const paid = parseFloat($('.payment-amount').text().replace(this.ctrl.currency,''));
            this.ctrl.completeOrder({ method, paid });
        });
        $('.cancel-payment-btn').on('click', () => this.ctrl.cancelCheckout());
    }

    show(totals) {
        $('.payment-amount').text(this.ctrl.currency + ' ' + totals.total.toFixed(2));
        this.$paid.text(this.ctrl.currency + ' ' + totals.total.toFixed(2));
        this.$panel.show();
        $('.pos-left').hide();
    }

    hide() {
        this.$panel.hide();
        $('.pos-left').show();
    }

    updateChange() {
        const paid = parseFloat($('.payment-amount').text().replace(this.ctrl.currency,''))||0;
        const total= parseFloat($('.grand-total').text())||0;
        this.$change.text(this.ctrl.currency + ' ' + Math.max(0, paid-total).toFixed(2));
        this.$paid.text(this.ctrl.currency + ' ' + paid.toFixed(2));
    }
}
