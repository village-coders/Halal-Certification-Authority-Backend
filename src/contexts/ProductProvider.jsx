// src/context/AuthProvider.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ProductContext } from "./productContext";

const ProductProvider = ({ children }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const token = JSON.parse(localStorage.getItem("accessToken"));

  // 🔐 Token expiration checker
  useEffect(() => {
    const interval = setInterval(() => {
      const storedToken = localStorage.getItem("accessToken");
      if (!storedToken) return;

      try {
        const token = JSON.parse(storedToken);
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("accessToken");
          toast.error("Session expired. Please log in again.");
          navigate("/signin");
        }
      } catch (err) {
        console.error("Token parsing error", err);
        localStorage.removeItem("accessToken");
        navigate("/signin");
      }
    }, 60000); // check every 60 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🧑‍🤝‍🧑 Fetch users
  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      if (!token) return;

      const res = await axios.get(`${baseUrl}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(res);
      

      setProducts(res.data.products); // ✅ now your user is available everywhere
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setProducts(null);
    } finally{
      setIsLoading(false);
    }
  };
  const deleteProduct = async (id) => {
    try {
      if (!token) return;

      const res = await axios.delete(`${baseUrl}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(res);
      toast.success(res.data.message)
      
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };


  const value = {
    products,
    setIsLoading,
    fetchProducts,
    isLoading,
    deleteProduct
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export default ProductProvider;
