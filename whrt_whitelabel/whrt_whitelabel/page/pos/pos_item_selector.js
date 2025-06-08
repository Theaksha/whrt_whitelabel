// whrt_whitelabel/whrt_whitelabel/page/pos/pos_item_selector.js
export class ItemSelector {
    constructor(controller) {
        this.ctrl = controller;
        this.$grid = $('.item-grid');
        this.$groupList = $('#group-list');
        this.$groupInput = $('.item-group-search');
        this.$grid.on('click', '.item-card', e => {
            const $c = $(e.currentTarget);
            this.ctrl.addToCart({
                item_code: $c.data('code'),
                item_name: $c.data('name'),
                valuation_rate: parseFloat($c.data('price')),
                stock_uom: $c.data('unit'),
                image: $c.data('img') || null,
                actual_qty: parseFloat($c.data('stock')) || 0
            });
        });
    }

    renderGroups(groups) {
  this.$groupList.empty();
  groups.forEach(g => {
    this.$groupList.append(`<option value="${g.name}">`);
  });
}


    renderItems(items, cart) {
        this.$grid.empty();
        if (!items.length) return this.$grid.html('<div class="no-items">No items found</div>');
       
        const getInit = name =>
            name.split(' ').map(w => w[0]).join('').substr(0,2).toUpperCase();

        items.forEach(item => {
            const qty = cart[item.item_code]?.qty || 0;
            const imgUrl = item.image && item.image.trim();
            const stockQty = item.actual_qty;
            const isStockItem = item.is_stock_item;
            
            let imageHTML;
            if (imgUrl) {
                imageHTML = `
                  <img src="${imgUrl}"
                       alt="${item.item_name}"
                       onerror="
                         this.style.display='none';
                         this.insertAdjacentHTML('afterend',
                           '<div class=&quot;item-initials&quot;>${ getInit(item.item_name) }</div>'
                         );
                       ">
                `;
            } else {
                imageHTML = `<div class="item-initials">${ getInit(item.item_name) }</div>`;
            }

            // Stock indicator - shows different states based on availability
            let stockHTML = '';
            if (isStockItem) {
                if (stockQty > 0) {
                    stockHTML = `
                        <div class="stock-info">
                            <span class="stock-qty">${stockQty} available</span>
                        </div>
                    `;
                } else {
                    stockHTML = `
                        <div class="stock-info out-of-stock">
                            <span class="stock-qty">Out of stock</span>
                        </div>
                    `;
                }
            } else {
                stockHTML = `
                    <div class="stock-info non-stock">
                        <span class="stock-qty">Non-stock item</span>
                    </div>
                `;
            }

            this.$grid.append(`
                <div class="item-card ${stockQty <= 0 && isStockItem ? 'out-of-stock' : ''}"
                     data-code="${item.item_code}"
                     data-name="${item.item_name}"
                     data-price="${item.valuation_rate}"
                     data-unit="${item.stock_uom}"
                     data-stock="${stockQty}"
                     ${imgUrl ? `data-img="${imgUrl}"` : ``}>
                  <div class="image-wrapper">
                    ${imageHTML}
                  </div>
                  <div class="item-name">${item.item_name}</div>
                  <div class="item-price">${this.ctrl.currency}${parseFloat(item.valuation_rate).toFixed(2)} / ${item.stock_uom}</div>
                  ${stockHTML}
                  ${qty > 0 ? `<div class="item-badge">${qty}</div>` : ''}
                </div>
            `);
        });
    }

    updateBadges(cart) {
        this.$grid.find('.item-card').each((i,el) => {
            const $c = $(el), code = $c.data('code'), qty = cart[code]?.qty || 0;
            const $b = $c.find('.item-badge');
            if (qty) {
                $b.length ? $b.text(qty) : $c.append(`<div class="item-badge">${qty}</div>`);
            } else {
                $b.remove();
            }
        });
    }

    hide() { $('.pos-left').hide(); }
    show() { $('.pos-left').show(); }
}