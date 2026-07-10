import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { user_role } from '&src/constants/PaymentAggregratorConstant';
import ProtectedLayout from '&src/containers/Layout/ProtectedLayout';
import PageErrorBoundary from '&src/containers/PageErrorBoundary';
import { getCookie } from '&src/utils/cookies';
import { Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, Route, Routes } from 'react-router-dom';
import { APPLICATION_ROUTES_URLS, DEFAULT_ROUTES, PROTECTED_ROUTES } from './routesConfig';

const ProtectedRoute = ({ element, allowedRoles, userRole, redirectTo }) => {

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }
  return element || <Navigate to={redirectTo} replace />;
};

// ✅ accept userRole as param
const renderRoutes = (routes, userRole) => {
  return routes.map((route) => {
    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <PageErrorBoundary pageName={route.path}>
            <Helmet>
              <title>{route.pageTitle}</title>

              {/* <title>{route.pageTitle} | PA GATI Portal</title> */}
            </Helmet>
            <Suspense fallback={<FullScreenLoader />}>
              <ProtectedRoute
                element={route.element}
                allowedRoles={route.allowedRoles}
                userRole={userRole} // ✅ properly passed now
                redirectTo={APPLICATION_ROUTES_URLS.DASHBOARD}
              />
            </Suspense>
          </PageErrorBoundary>
        }
      />
    )
  });
};

const PublicRoutes = () => (
  <Routes>
    <Route path={APPLICATION_ROUTES_URLS.LOGIN}>
      {renderRoutes(DEFAULT_ROUTES)}
    </Route>
    <Route path="*" element={<Navigate to={APPLICATION_ROUTES_URLS.LOGIN} replace />} />
  </Routes>
);

const ProtectedRoutes = ({ userRole }) => {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        {renderRoutes(PROTECTED_ROUTES, userRole)} {/* ✅ now works */}
      </Route>
      <Route path="*" element={<Navigate to={APPLICATION_ROUTES_URLS.DASHBOARD} replace />} />
    </Routes>
  );
};

const RoutingProvider = () => {
  const isAuthenticated = getCookie('accessToken');
  // Ideally fetch role dynamically instead of static constant
  return (
    <Suspense fallback={<FullScreenLoader />}>
      {isAuthenticated ? <ProtectedRoutes userRole={user_role} /> : <PublicRoutes />}
    </Suspense>
  );
};

export default RoutingProvider;
