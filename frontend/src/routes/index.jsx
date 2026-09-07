import React, { Suspense } from 'react';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { user_role } from '&src/constants/PaymentAggregratorConstant';
import ProtectedLayout from '&src/containers/Layout/ProtectedLayout';
import PageErrorBoundary from '&src/containers/PageErrorBoundary';
import NetworkStatusBanner from '&src/components/common/NetworkStatusBanner';
import NotFound from '&src/pages/Errors/NotFound';
import { getCookie } from '&src/utils/cookies';
import { Helmet } from 'react-helmet';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  APPLICATION_ROUTES_URLS,
  DEFAULT_ROUTES,
  PROTECTED_ROUTES,
  PUBLIC_ERROR_ROUTES,
} from './routesConfig';

const ProtectedRoute = ({ element, allowedRoles, userRole, redirectTo }) => {
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo || APPLICATION_ROUTES_URLS.ACCESS_DENIED} replace />;
  }
  return element || <Navigate to={redirectTo || APPLICATION_ROUTES_URLS.DASHBOARD} replace />;
};

const renderRoutes = (routes, userRole) => {
  return routes.map((route) => {
    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <PageErrorBoundary pageName={route.path}>
            <Helmet>
              <title>{route.pageTitle || 'Payment Aggregator Portal'}</title>
            </Helmet>
            <Suspense fallback={<FullScreenLoader />}>
              <ProtectedRoute
                element={route.element}
                allowedRoles={route.allowedRoles}
                userRole={userRole}
                redirectTo={APPLICATION_ROUTES_URLS.ACCESS_DENIED}
              />
            </Suspense>
          </PageErrorBoundary>
        }
      />
    );
  });
};

const PublicRoutes = () => (
  <Routes>
    {renderRoutes(DEFAULT_ROUTES)}
    {renderRoutes(PUBLIC_ERROR_ROUTES)}
    <Route
      path="/"
      element={<Navigate to={APPLICATION_ROUTES_URLS.LOGIN} replace />}
    />
    <Route
      path="*"
      element={
        <PageErrorBoundary pageName="404 Not Found">
          <Helmet>
            <title>404 - Page Not Found | Payment Aggregator Portal</title>
          </Helmet>
          <NotFound />
        </PageErrorBoundary>
      }
    />
  </Routes>
);

const ProtectedRoutes = ({ userRole }) => {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        {renderRoutes(PROTECTED_ROUTES, userRole)}
      </Route>
      {renderRoutes(PUBLIC_ERROR_ROUTES)}
      <Route
        path="/"
        element={<Navigate to={APPLICATION_ROUTES_URLS.DASHBOARD} replace />}
      />
      <Route
        path="*"
        element={
          <PageErrorBoundary pageName="404 Not Found">
            <Helmet>
              <title>404 - Page Not Found | Payment Aggregator Portal</title>
            </Helmet>
            <NotFound />
          </PageErrorBoundary>
        }
      />
    </Routes>
  );
};

const RoutingProvider = () => {
  const isAuthenticated = Boolean(getCookie('accessToken'));

  return (
    <>
      <NetworkStatusBanner />
      <Suspense fallback={<FullScreenLoader />}>
        {isAuthenticated ? <ProtectedRoutes userRole={user_role} /> : <PublicRoutes />}
      </Suspense>
    </>
  );
};

export default RoutingProvider;
