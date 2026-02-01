const express = require('express');

const productRouter = express.Router()

const {createProduct, getMyProducts, deleteMyProduct, getAllProducts, getSingleProducts, rejectProduct, approveProduct} = require("../Controllers/productController.js");
const isLoggedIn = require('../Middlewares/isLoggedIn.js');
const isAdmin = require('../Middlewares/isAdmin.js');

// CREATE a product
productRouter.post("/", isLoggedIn, createProduct);

// LIST all products (admin only)
productRouter.get("/admin-all", getAllProducts);

// LIST my products
productRouter.get("/", isLoggedIn, getMyProducts);

// GET single product by ID
productRouter.get("/:id", getSingleProducts);


productRouter.put("/reject/:id", rejectProduct);

productRouter.put("/approve/:id", approveProduct);

// DELETE product
productRouter.delete("/:id", isLoggedIn, deleteMyProduct);



module.exports = productRouter  