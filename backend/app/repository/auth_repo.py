import logging
from ldap3 import Server, Connection, ALL
from ldap3.core.exceptions import LDAPBindError, LDAPSocketOpenError, LDAPException
from app.core import config

logger = logging.getLogger(__name__)


class LDAPAuthRepository:
    def authenticate(self, username: str, password: str) -> bool:
        """
        Authenticate user against LDAP / Active Directory.

        Returns:
            True   — credentials valid (bind succeeded)
            False  — invalid credentials (wrong password / user not in AD)

        Raises:
            RuntimeError — LDAP server unreachable or unexpected error
        """
        mode = getattr(config, "MODE", "")
        if mode and mode.strip().upper() == "UAT":
            logger.info(f"MODE is UAT — bypassing LDAP password validation for '{username}' and returning True.")
            return True

        ldap_enabled = getattr(config, "LDAP_ENABLED", False)
        if not ldap_enabled:
            # Bypass only allowed when explicitly disabled (e.g., local dev without bank network)
            logger.warning(
                f"LDAP is DISABLED — skipping authentication for '{username}'. "
                "Set LDAP_ENABLED=True to enforce real AD validation."
            )
            return True

        if not password or not str(password).strip():
            logger.warning(f"LDAP auth rejected for '{username}': empty password supplied.")
            return False

        try:
            ldap_server = getattr(config, "LDAP_SERVER", "ldaps://CBI.CO.IN")
            server = Server(ldap_server, get_info=ALL, use_ssl=True, connect_timeout=5)
            conn = Connection(
                server,
                user=f"{config.DOMAIN}\\{username}",
                password=password,
                auto_bind=True,
            )
            bound = conn.bound
            if bound:
                logger.info(f"LDAP auth SUCCESS for '{username}'")
            else:
                logger.warning(f"LDAP auth FAILED for '{username}': bind returned False (wrong password or account issue)")
            return bound

        except LDAPBindError as e:
            # Wrong password or account locked/disabled in AD
            logger.warning(f"LDAP auth FAILED for '{username}': invalid credentials — {e}")
            return False

        except LDAPSocketOpenError as e:
            # LDAP server unreachable — network issue
            logger.error(f"LDAP server unreachable for '{username}': {e}")
            raise RuntimeError(
                "Unable to reach the authentication server. Please try again later or contact IT support."
            ) from e

        except LDAPException as e:
            # Any other ldap3 exception
            logger.error(f"LDAP unexpected error for '{username}': {e}")
            raise RuntimeError(
                "An unexpected authentication error occurred. Please try again."
            ) from e

        except Exception as e:
            logger.error(f"LDAP auth unexpected exception for '{username}': {e}", exc_info=True)
            raise RuntimeError(
                "An unexpected authentication error occurred. Please try again."
            ) from e
