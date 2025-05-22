import { createBrowserRouter } from "react-router";
import AuthLayout from "../layouts/authLayout";
import Login from "../pages/login";
import App from "../App";


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: <Login />
          }
        ]
      }
    ]
  },

]);

export default router; 