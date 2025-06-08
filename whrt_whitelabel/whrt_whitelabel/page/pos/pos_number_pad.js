// whrt_whitelabel/whrt_whitelabel/page/pos/pos_number_pad.js
export class NumberPad {
    constructor(controller) {
        this.ctrl = controller;
        this.$numpad = $('.numpad');
        this.$display = $('.payment-amount');
        this.$paidAmount = $('.paid-amount-input');
        this._bind();
    }

    _bind() {
        this.$numpad.on('click', '.numpad-btn', e => {
            let val = this.$display.text().replace(this.ctrl.currency, '').trim();
            const btn = $(e.currentTarget).text();
            if (btn==='Delete') {
                val = val.slice(0, -1) || '0.00';
            } else {
                val = val==='0.00' ? btn : val + btn;
            }
            this.$display.text(this.ctrl.currency + ' ' + val);
            this.$paidAmount.val(val);
            this.ctrl.payment.updateChange();
        });
    }
}
