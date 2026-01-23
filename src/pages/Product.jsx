import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import "./css/Product.css";
import axios from "axios"; // if you want to call backend
import { toast } from "sonner";
import { useProducts } from "../hooks/useProducts";
import { useEffect } from "react";
import { MdOutlineDeleteForever } from "react-icons/md";


const Product = () => {
  const [showProductForm, setShowProductForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [nonApprovedProducts, setNonApprovedProducts] = useState([]);
  const [registeredProducts, setRegisteredProducts] = useState([]);

  const {products, isLoading, fetchProducts, deleteProduct} = useProducts();

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const toggleProductForm = () => setShowProductForm((prev) => !prev);

  // handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      // ✅ OPTION 2: Call backend API
      const token = JSON.parse(localStorage.getItem("accessToken"));
      const res = await axios.post(
        `${baseUrl}/products`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    //   setProducts([...products, res.data]);
      console.log(res.data);

      if(res.data.status === "success"){
        setFormData({ name: "", price: ""});
        setShowProductForm(false);
        toast.success(res.data.message);
        fetchProducts();
      }

    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  const deleteProductFromList = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this product?");
    if (!isConfirmed) return;
    await deleteProduct(id);
    fetchProducts(); // refresh after delete
  }

  useEffect(() => {
    if (products && products.length > 0) {
        const appProducts = products.filter((p) => p.status === "approved");
        setApprovedProducts(appProducts);

        //nonApprovedProducts
        const nonProducts = products.filter((p) => p.status === "requested");
        setNonApprovedProducts(nonProducts);

        //registeredProducts
        const registeredProducts = products.filter((p) => p.status === "registered");
        setRegisteredProducts(registeredProducts);
    }
  }, [products]); // run whenever products changes
  

  useEffect(() => {
    fetchProducts();
  }, []);


  return (
    <div className="dash">
      <Sidebar activeP="active" />
      <main className="content">
        <div>
          <div className="product-container">
            <div className="product-header">
              <h2>Products</h2>
              <button className="add-product-btn" onClick={toggleProductForm}>
                <i className="fas fa-plus-circle"></i> Request Product
              </button>
            </div>

            <h3>All Products ( {products.length} )</h3>


            {/* Show product list */}
            <div className="product-table-container">
                {isLoading ?(
                    <p>Loading...</p>
                ) :
                (products.length === 0 ? (
                    <p>No products yet.</p>
                ) : (
                    <table className="product-table">
                    <thead>
                        <tr>
                        <th>#</th>
                        <th>Product Name</th>
                        <th>Price ($)</th>
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, index) => (
                        <tr key={p._id}>
                            <td>{index + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.price}</td>
                            <td onClick={()=> deleteProductFromList(p._id)}
                                style={{ cursor: "pointer", color: "red" }}
                                >
                                <MdOutlineDeleteForever />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                ))}
            </div>

            <h3>Approved Products ( {approvedProducts.length} )</h3>

            {/* Show approved product list */}
            <div className="product-table-container">
                {isLoading ?(
                    <p>Loading...</p>
                ) :
                (approvedProducts.length === 0 ? (
                    <p>No products yet.</p>
                ) : (
                    <table className="product-table">
                    <thead>
                        <tr>
                        <th>#</th>
                        <th>Product Name</th>
                        <th>Price ($)</th>
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedProducts.map((p, index) => (
                        <tr key={p._id}>
                            <td>{index + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.price}</td>
                            <td onClick={()=> deleteProductFromList(p._id)}
                                style={{ cursor: "pointer", color: "red" }}
                                >
                                <MdOutlineDeleteForever />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                ))}
            </div>

            <h3>Non Approved Products ( {nonApprovedProducts.length} )</h3>

            {/* Show non approved product list */}
            <div className="product-table-container">
                {isLoading ?(
                    <p>Loading...</p>
                ) :
                (nonApprovedProducts.length === 0 ? (
                    <p>No products yet.</p>
                ) : (
                    <table className="product-table">
                    <thead>
                        <tr>
                        <th>#</th>
                        <th>Product Name</th>
                        <th>Price ($)</th>
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nonApprovedProducts.map((p, index) => (
                        <tr key={p._id}>
                            <td>{index + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.price}</td>
                            <td onClick={()=> deleteProductFromList(p._id)}
                                style={{ cursor: "pointer", color: "red" }}
                                >
                                <MdOutlineDeleteForever />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                ))}
            </div>

            <h3>Registered Products ( {registeredProducts.length} )</h3>

            {/* Show non approved product list */}
            <div className="product-table-container">
                {isLoading ?(
                    <p>Loading...</p>
                ) :
                (registeredProducts.length === 0 ? (
                    <p>No products yet.</p>
                ) : (
                    <table className="product-table">
                    <thead>
                        <tr>
                        <th>#</th>
                        <th>Product Name</th>
                        <th>Price ($)</th>
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registeredProducts.map((p, index) => (
                        <tr key={p._id}>
                            <td>{index + 1}</td>
                            <td>{p.name}</td>
                            <td>{p.price}</td>
                            <td onClick={()=> deleteProductFromList(p._id)}
                                style={{ cursor: "pointer", color: "red" }}
                                >
                                <MdOutlineDeleteForever />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                ))}
            </div>


          </div>
        </div>
      </main>

      {/* Product Form Popup */}
      {showProductForm && (
        <div className="modal-overlay" onClick={toggleProductForm}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h2>Request New Product</h2>
            <form className="product-form" onSubmit={handleSubmit}>
              <label>
                Product Name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </label>
              {/* <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </label> */}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={toggleProductForm}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
