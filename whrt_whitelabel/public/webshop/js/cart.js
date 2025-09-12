document.addEventListener("DOMContentLoaded", function () {
  // Load cart count on page load
  updateCartCount();

  // Handle add-to-cart click
  document.querySelectorAll(".add-to-cart-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      
    const item = {
        code: this.getAttribute("data-item"),
        item_name: this.getAttribute("data-name"),
        image: this.getAttribute("data-image"),
        price: parseFloat(this.getAttribute("data-price")),
        qty: 1
      };
 
  

      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      // Add to cart (avoid duplicates if needed)
      // Check if item already exists
      const existing = cart.find(i => i.name === item.code);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push(item);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      alert("Item added to cart!");
    });
  });

  function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const countEl = document.getElementById("cart-count");
    if (countEl) {
      countEl.textContent = cart.length;
    }
  }
});
