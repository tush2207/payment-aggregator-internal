import { lazy } from 'react';
//-------------------------------APPLICATION_ROUTES_URLS-------------------------------//

const APPLICATION_ROUTES_URLS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  AGGREGRATOR_DASHBOARD: '/aggregrator-dashboard',
  MANAGE_AGGREGRATOR: '/manage-aggregrator',
  HELP_DESK:'/helpdesk'
};

//-------------------------------LAZY IMPORTS-------------------------------//

const Login = lazy(() => import('&src/Pages/Login'));

const Dashboard = lazy(() => import('&src/pages/Dashboard'));

const ManageAggregator = lazy(() => import('&src/pages/ManageAggregator'));

const AggregratorDashboard = lazy(() => import('&src/pages/AggregratorDashboard'));

const HelpDesk = lazy(() => import('&src/pages/HelpDesk'));

//-------------------------------DEFAULT ROUTES-------------------------------//

const DEFAULT_ROUTES = [
  {
    pageTitle: 'Login',
    path: APPLICATION_ROUTES_URLS.LOGIN,
    element: <Login />,
  },
];

//-------------------------------PROTECTED ROUTES-------------------------------//

const PROTECTED_ROUTES = [
  {
    pageTitle: 'Dashboard',
    path: APPLICATION_ROUTES_URLS.DASHBOARD,
    element: <Dashboard />,
  },
  {
    pageTitle: 'Manage Aggregator',
    path: APPLICATION_ROUTES_URLS.MANAGE_AGGREGRATOR,
    element: <ManageAggregator />,
    allowedRoles: ["CO"],   // 🔑 only CO can access
  },
  {
    pageTitle: 'Payment Aggregators',
    path: APPLICATION_ROUTES_URLS.AGGREGRATOR_DASHBOARD,
    element: <AggregratorDashboard />,
  },
  {
    pageTitle: 'Help Desk',
    path: APPLICATION_ROUTES_URLS.HELP_DESK,
    element: <HelpDesk />,
  }
];

export { APPLICATION_ROUTES_URLS, DEFAULT_ROUTES, PROTECTED_ROUTES };
