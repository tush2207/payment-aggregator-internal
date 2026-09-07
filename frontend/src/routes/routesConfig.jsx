import { lazy } from 'react';

//-------------------------------APPLICATION_ROUTES_URLS-------------------------------//

const APPLICATION_ROUTES_URLS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ALL_APPLICATIONS: '/applications',
  AGGREGRATOR_DASHBOARD: '/aggregrator-dashboard',
  MANAGE_AGGREGRATOR: '/manage-aggregrator',
  HELP_DESK: '/helpdesk',
  TEST_FLOW: '/test-flow',
  SERVICE_DOWN: '/service-down',
  MAINTENANCE: '/maintenance',
  NOT_FOUND: '/404',
  ACCESS_DENIED: '/403',
  SERVER_ERROR: '/500',
};

//-------------------------------LAZY IMPORTS-------------------------------//

const Login = lazy(() => import('&src/pages/Login'));
const Dashboard = lazy(() => import('&src/pages/Dashboard'));
const Applications = lazy(() => import('&src/pages/Applications'));
const ManageAggregator = lazy(() => import('&src/pages/ManageAggregator'));
const AggregratorDashboard = lazy(() => import('&src/pages/AggregratorDashboard'));
const HelpDesk = lazy(() => import('&src/pages/HelpDesk'));
const TestApplicationFlow = lazy(() => import('&src/pages/TestApplicationFlow'));

// Error & Status Pages
const ServiceDown = lazy(() => import('&src/pages/Errors/ServiceDown'));
const NotFound = lazy(() => import('&src/pages/Errors/NotFound'));
const AccessDenied = lazy(() => import('&src/pages/Errors/AccessDenied'));
const ServerError = lazy(() => import('&src/pages/Errors/ServerError'));

//-------------------------------PUBLIC / ERROR ROUTES-------------------------------//

const PUBLIC_ERROR_ROUTES = [
  {
    pageTitle: 'Service Unavailable | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.SERVICE_DOWN,
    element: <ServiceDown />,
  },
  {
    pageTitle: 'System Maintenance | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.MAINTENANCE,
    element: <ServiceDown />,
  },
  {
    pageTitle: 'Page Not Found | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.NOT_FOUND,
    element: <NotFound />,
  },
  {
    pageTitle: 'Access Denied | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.ACCESS_DENIED,
    element: <AccessDenied />,
  },
  {
    pageTitle: 'Server Error | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.SERVER_ERROR,
    element: <ServerError />,
  },
];

//-------------------------------DEFAULT ROUTES-------------------------------//

const DEFAULT_ROUTES = [
  {
    pageTitle: 'Login | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.LOGIN,
    element: <Login />,
  },
  ...PUBLIC_ERROR_ROUTES,
];

//-------------------------------PROTECTED ROUTES-------------------------------//

const PROTECTED_ROUTES = [
  {
    pageTitle: 'Dashboard | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.DASHBOARD,
    element: <Dashboard />,
  },
  {
    pageTitle: 'Applications | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.ALL_APPLICATIONS,
    element: <Applications />,
  },
  {
    pageTitle: 'Manage Aggregator | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.MANAGE_AGGREGRATOR,
    element: <ManageAggregator />,
    allowedRoles: ['CO'], // 🔑 only CO can access
  },
  {
    pageTitle: 'Payment Aggregators | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.AGGREGRATOR_DASHBOARD,
    element: <AggregratorDashboard />,
  },
  {
    pageTitle: 'Help Desk | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.HELP_DESK,
    element: <HelpDesk />,
  },
  {
    pageTitle: 'Test Application Flow | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.TEST_FLOW,
    element: <TestApplicationFlow />,
  },
  ...PUBLIC_ERROR_ROUTES,
];

export {
  APPLICATION_ROUTES_URLS,
  DEFAULT_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ERROR_ROUTES,
};
