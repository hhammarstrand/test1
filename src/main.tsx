import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import DashboardPage from './features/dashboard/DashboardPage';
import OrdersPage from './features/orders/OrdersPage';
import OrderDetailPage from './features/orders/OrderDetailPage';
import CustomersPage from './features/orders/CustomersPage';
import ArticlesPage from './features/articles/ArticlesPage';
import ArticleDetailPage from './features/articles/ArticleDetailPage';
import PlanningPage from './features/planning/PlanningPage';
import MachinesPage from './features/planning/MachinesPage';
import InventoryPage from './features/purchasing/InventoryPage';
import PurchaseOrdersPage from './features/purchasing/PurchaseOrdersPage';
import PurchaseOrderDetailPage from './features/purchasing/PurchaseOrderDetailPage';
import SuppliersPage from './features/purchasing/SuppliersPage';
import './app.css';

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'ordrar', element: <OrdersPage /> },
      { path: 'ordrar/:id', element: <OrderDetailPage /> },
      { path: 'kunder', element: <CustomersPage /> },
      { path: 'artiklar', element: <ArticlesPage /> },
      { path: 'artiklar/:id', element: <ArticleDetailPage /> },
      { path: 'planering', element: <PlanningPage /> },
      { path: 'maskiner', element: <MachinesPage /> },
      { path: 'lager', element: <InventoryPage /> },
      { path: 'inkop', element: <PurchaseOrdersPage /> },
      { path: 'inkop/:id', element: <PurchaseOrderDetailPage /> },
      { path: 'leverantorer', element: <SuppliersPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
