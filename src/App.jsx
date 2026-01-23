import {BrowserRouter, Route, Routes, useLocation} from "react-router-dom"
import { Toaster } from "sonner";
import Header from "./components/Header";
import AuthProvider from "./contexts/AuthProvider";
import LoginCard from "./components/LoginCard";
import Home from "./pages/Home";
import RegisterForm from "./pages/RegisterForm";
import Applications from "./pages/Applications";
import Certificate from "./pages/Certificate";
import Dashboard from "./pages/Dashboard";
import VerifyAccount from "./pages/VerifyAccount";
import Product from "./pages/Product";
import ProductProvider from "./contexts/ProductProvider";
import AdminSignup from "./pages/AdminSignup";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";

const AppContent = () => {
  // const location = useLocation();
  // const hideHeaderRoutes = [
  //   '/dashboard',
  //   // '/',
  //   '/application',
  //   '/certificate',
  //   '/products',
  //   "/admin-signup",
  //   "/admin-signin",
  //   "/admin",
  // ];
  // const hideFooterRoutes = [
  //   '/'
  // ];

  // const shouldHideFooter = hideFooterRoutes.some((route) => {
  //   if (route.includes(':')) {
  //     // Convert "/admin-message/:userId" to a regex like /^\/admin-message\/[^\/]+$/
  //     const pattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
  //     return pattern.test(location.pathname);
  //   }
  //   return route === location.pathname;
  // });

  // const shouldHideHeader = hideHeaderRoutes.some((route) => {
  //   if (route.includes(':')) {
  //     // Convert "/admin-message/:userId" to a regex like /^\/admin-message\/[^\/]+$/
  //     const pattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
  //     return pattern.test(location.pathname);
  //   }
  //   return route === location.pathname;
  // });
    return (
      <>
        {/* {!shouldHideHeader &&  <Header />} */}

        <AuthProvider>
        <ProductProvider>
          <Routes>
            <Route path="/"  element={<Home />}/>
            <Route path="/signup"  element={<RegisterForm />}/>
            <Route path="/admin-signup"  element={<AdminSignup />}/>
            <Route path="/admin-signin"  element={<AdminLogin />}/>
            <Route path="/admin"  element={<Admin />}/>
            <Route path="/products"  element={<Product />}/>
            <Route path="/application"  element={<Applications />}/>
            <Route path="/certificate"  element={<Certificate />}/>
            <Route path="/dashboard"  element={<Dashboard />}/>
            <Route path="/verify/:token"  element={<VerifyAccount />}/>

            {/* <Route element={<ProtectedRoutes requiredRole="seller" />}>
              
              <Route path="/dashboard"  element={<Dashboard />}/>
            
            </Route> */}

            <Route path="*" element={<h1 style={{marginTop: "100px", textAlign: "center"}}>Page not found</h1>} />
          </Routes>

          <Toaster
          position="top-right"
          richColors
          closeButton
          visibleToasts={1}
          />
          {/* {!shouldHideFooter && <Footer />} */}
          {/* <Footer /> */}
        </ProductProvider>
        </AuthProvider>

        
      </>
    );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
