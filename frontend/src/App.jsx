
import { useEffect } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import { getCurrentUser } from "./api/authApi";
import { getCart } from "./api/cartApi";

import {
  setUser,
  setAuthLoading,
  clearUser,
} from "./redux/authSlice";

import {
  setCart,
  clearCart,
} from "./redux/cartSlice";

import "./App.css";

function Layout() {
  return (
    <>
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      dispatch(setAuthLoading(true));

      try {
        const data = await getCurrentUser();

        if (cancelled) return;

        if (!data?.user) {
          dispatch(clearUser());
          dispatch(clearCart());
          return;
        }

        dispatch(setUser(data.user));

        try {
          const cart = await getCart();

          if (!cancelled) {
            dispatch(setCart(cart));
          }
        } catch (cartError) {
          if (!cancelled) {
            console.error(
              "Unable to restore cart:",
              cartError.response?.data?.message || cartError.message
            );
          }
        }
      } catch (error) {
        if (cancelled) return;

        dispatch(clearUser());
        dispatch(clearCart());

        if (error.response?.status !== 401) {
          console.error(
            "Unable to restore session:",
            error.response?.data?.message || error.message
          );
        }
      } finally {
        if (!cancelled) {
          dispatch(setAuthLoading(false));
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetails />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          {/* Task 13 will add the checkout page here. */}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
