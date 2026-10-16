import React, { Suspense } from 'react';
import FullScreenLoader from '&src/components/feedback/FullScreenLoader';
import { user_role } from '&src/constants/PaymentAggregratorConstant';
import ProtectedLayout from '&src/components/layout/ProtectedLayout';
import PageErrorBoundary from '&src/components/layout/PageErrorBoundary';
import NetworkStatusBanner from '&src/components/common/NetworkStatusBanner';
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
  if (allowedRoles && userRole !== 'ADMIN' && !allowedRoles.includes(userRole)) {
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
      element={<Navigate to={APPLICATION_ROUTES_URLS.LOGIN} replace />}
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
        element={<Navigate to={APPLICATION_ROUTES_URLS.NOT_FOUND} replace />}
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
