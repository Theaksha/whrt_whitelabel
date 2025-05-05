// whrt_pos_injector.js
export function injectDependencies() {
  // CSS/JS dependencies injection
  if (!$('link[href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css"]').length) {
    $('head').append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css">');
  }
  if (!$('script[src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"]').length) {
    $('head').append('<script src="https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js"></script>');
  }
  if (!$('link[href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"]').length) {
    $('head').append('<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">');
  }
  if (!$('script[src="https://cdnjs.cloudflare.com/ajax/libs/jquery-format/1.0/jquery.format.min.js"]').length) {
    $('head').append('<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-format/1.0/jquery.format.min.js"></script>');
  }
  if (!$('script[src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"]').length) {
    $('head').append('<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>');
  }
  if (!$('script[src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"]').length) {
    $('head').append('<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>');
  }
  if (!$('link[href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap"]').length) {
    $('head').append('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap" rel="stylesheet">');
  }
  if (!$('link[href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"]').length) {
    $('head').append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">');
  }
  
  // Custom CSS injection
  if (!$('style#custom-pos-style').length) {
    $('head').append(`
      <style id="custom-pos-style">
        /* Global Reset & Fonts */
        body, html {
          font-family: 'Roboto', sans-serif;
          background-color: #f7f9fc;
        }
        .wrapper { background-color: #f7f9fc; }
        /* Navbar styling */
        .main-header.navbar {
          background: linear-gradient(135deg, #0a2342, #013a70);
          border-bottom: none;
          padding: 0.5rem 1rem;
        }
        .main-header .nav-link, .main-header .navbar-brand {
          color: #ffffff !important;
        }
        .navbar-center {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Montserrat', sans-serif;
        }
        .navbar-center h3 {
          margin: 0;
          font-weight: 500;
          font-size: 1.75rem;
          color: #ffffff;
        }
        /* Sidebar Toggle styling */
        .main-header .nav-link[data-widget="pushmenu"] {
          color: #ffffff !important;
          font-size: 1.5rem;
          background-color: transparent;
          padding: 0.2rem;
          margin-top: 5px;
        }
        .navbar-nav.ml-auto li { margin-left: 0.75rem; }
        /* Sidebar styling */
        .main-sidebar {
          background-color: #0a2342;
          box-shadow: 2px 0 8px rgba(0,0,0,0.2);
		  
        }
        .main-sidebar .brand-link {
          background-color: #0a2342;
          border-bottom: 1px solid #013a70;
          font-size: 1.2rem;
          font-weight: 500;
          text-align: center;
        }
        .main-sidebar .nav-sidebar .nav-link {
          color: #cfd8dc;
          padding: 0.75rem 1rem;
          margin: 0.25rem 0;
          border-radius: 4px;
          transition: background-color 0.2s, color 0.2s;
        }
        .main-sidebar .nav-sidebar .nav-link:hover, 
        .main-sidebar .nav-sidebar .nav-link.active {
          background-color: #013a70;
          color: #ffffff;
        }
		.sidebar {
  max-height: 100vh; /* Limit height to viewport */
  overflow-y: auto;  /* Enable vertical scrolling */
}


        /* Card and Product Grid styling */
        .card {
          border: none;
          border-radius: 8px;
          background-color: #ffffff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          margin-bottom: 1rem;
        }
        .card-header {
          background-color: transparent;
          border-bottom: none;
        }
        .card-body { background-color: #ffffff; }
		.product-search-bar {
  margin-bottom: 20px;
}

.product-search-input {
  width: 50%;
  padding: 10px;
  font-size: 16px;
}

        .product-grid {		  
		  display: grid;
		  grid-template-columns: repeat(4, 1fr);
		  gap: 1rem;   
          background-color: #e8eff7;
          padding: 1rem;
          border-radius: 8px;
		  height: 700px;       /* Set a fixed height for scrolling */
		  overflow-y: auto;    /* Enables vertical scrolling when needed */
        }
        .product-item {
  position: relative; /* Ensure absolute-positioned children (like the badge) can be placed correctly */
  width: 100%;
  height: 250px;
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid #d1e3f0;
  border-radius: 8px;
  position: relative;
  transition: transform 0.2s;
}

.stock-badge {
  position: absolute;
  top: 8px;    /* Adjust as needed */
  right: 8px;  /* Adjust as needed */
  z-index: 5;  /* Ensure it stays on top of the image */
  font-size: 0.8rem; 
  padding: 5px 8px;
  border-radius: 12px;
  color: #fff;
}

        .product-item:hover { transform: translateY(-5px); }
        .product-item .card-img-top {
          object-fit: cover;
          height: 60%;
          width: 100%;
        }
        .product-item .product-info {
          padding: 0.75rem;
        }
        .product-item .product-name {
          font-size: 1rem;
          font-weight: 500;
          color: #013a70;
        }
        /* Price tag: positioned near the bottom with minimal gap */
        .product-item .product-price {
          position: absolute;          
          right: 0.5rem;
          font-size: 1rem;
          font-weight: bold;
          color: darkorange;
        }
		
        /* Item Cart heading style */
        .card-header h4 {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
        }
        /* Cart item styles */
        .cart-item {
          font-family: 'Roboto', sans-serif;
        }
        .cart-item .cart-item-name { font-size: 0.9rem; font-weight: 500; }
        .cart-item .cart-item-qty { 
          font-size: 0.85rem; 
          display: flex; 
          align-items: center; 
        }
        .cart-item .cart-item-qty button { 
          padding: 0.05rem 0.1rem; 
          font-size: 0.6rem; 
          margin: 0 0.2rem; 
        }
        .cart-item-divider { 
          margin: 0.5rem 0; 
          border-top: 1px solid #e0e0e0; 
        }
        /* Button styles */
        .btn-home {
          background-color: #f0ad4e;
          border-color: #f0ad4e;
          color: #ffffff;
        }
        .btn-home:hover {
          background-color: #ec971f;
          border-color: #d58512;
        }
        /* Modal / Payment Block styling */
        .modal-header, .modal-footer {
          background-color: #013a70;
          color: #ffffff;
        }
        .modal-content { 
          border-radius: 8px; 
          border: none;
        }
        .modal-body {
          background-color: #e8eff7;
          padding: 1.5rem;
        }
        .numpad .btn {
          width: 60px;
          height: 60px;
          font-size: 1.2rem;
          margin: 0.3rem;
        }
        /* Customer dropdown styling */
        .customer-dropdown {
          border-radius: 4px;
        }
      </style>
    `);
  }
}
