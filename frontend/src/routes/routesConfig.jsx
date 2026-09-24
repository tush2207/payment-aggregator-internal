import { lazyWithRetry } from '&src/utils/lazyWithRetry';

//-------------------------------APPLICATION_ROUTES_URLS-------------------------------//

const APPLICATION_ROUTES_URLS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ALL_APPLICATIONS: '/applications',
  AGGREGRATOR_DASHBOARD: '/aggregrator-dashboard',
  MANAGE_AGGREGRATOR: '/manage-aggregrator',
  HELP_DESK: '/helpdesk',
  ANNEXURES: '/annexures',
  QA_DASHBOARD: '/qa-dashboard',
  TEST_FLOW: '/test-flow',
  SERVICE_DOWN: '/service-down',
  MAINTENANCE: '/maintenance',
  NOT_FOUND: '/404',
  ACCESS_DENIED: '/403',
  SERVER_ERROR: '/500',
};

//-------------------------------LAZY IMPORTS-------------------------------//

const Login = lazyWithRetry(() => import('&src/pages/Login'), 'Login');
const Dashboard = lazyWithRetry(() => import('&src/pages/Dashboard'), 'Dashboard');
const Applications = lazyWithRetry(() => import('&src/pages/Applications'), 'Applications');
const ManageAggregator = lazyWithRetry(() => import('&src/pages/ManageAggregator'), 'ManageAggregator');
const AggregratorDashboard = lazyWithRetry(() => import('&src/pages/AggregratorDashboard'), 'AggregratorDashboard');
const HelpDesk = lazyWithRetry(() => import('&src/pages/HelpDesk'), 'HelpDesk');
const Annexures = lazyWithRetry(() => import('&src/pages/Annexures'), 'Annexures');
const QADashboard = lazyWithRetry(() => import('&src/pages/QADashboard'), 'QADashboard');
const TestApplicationFlow = lazyWithRetry(() => import('&src/pages/TestApplicationFlow'), 'TestApplicationFlow');

// Error & Status Pages
const ServiceDown = lazyWithRetry(() => import('&src/pages/Errors/ServiceDown'), 'ServiceDown');
const NotFound = lazyWithRetry(() => import('&src/pages/Errors/NotFound'), 'NotFound');
const AccessDenied = lazyWithRetry(() => import('&src/pages/Errors/AccessDenied'), 'AccessDenied');
const ServerError = lazyWithRetry(() => import('&src/pages/Errors/ServerError'), 'ServerError');

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

// Check if running in development mode
const IS_DEV =
  import.meta.env.VITE_DEV_MODE === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_DEV_MODE !== 'false');

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
    pageTitle: 'Standard Annexures | Payment Aggregator Portal',
    path: APPLICATION_ROUTES_URLS.ANNEXURES,
    element: <Annexures />,
  },
  // 🔬 Dev-Only QA & TDD Routes (Automatically excluded in production builds)
  ...(IS_DEV
    ? [
        {
          pageTitle: 'QA & TDD Test Lab | Payment Aggregator Portal',
          path: APPLICATION_ROUTES_URLS.QA_DASHBOARD,
          element: <QADashboard />,
        },
        {
          pageTitle: 'Workflow Simulator | Payment Aggregator Portal',
          path: APPLICATION_ROUTES_URLS.TEST_FLOW,
          element: <TestApplicationFlow />,
        },
      ]
    : []),
  ...PUBLIC_ERROR_ROUTES,
];

export {
  APPLICATION_ROUTES_URLS,
  DEFAULT_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ERROR_ROUTES,
};
