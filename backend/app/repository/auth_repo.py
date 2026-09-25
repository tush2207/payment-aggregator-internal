import logging
from ldap3 import Server, Connection, ALL, NTLM
from ldap3.core.exceptions import LDAPBindError, LDAPSocketOpenError, LDAPException
from app.core import config

logger = logging.getLogger(__name__)

class LDAPAuthRepository:
    def authenticate(self, username: str, password: str) -> bool:
        """
        Authenticate user against LDAP / Active Directory.

        Returns:
            True   - credentials valid (bind succeeded)
            False  - invalid credentials (wrong password / user not in AD)

        Raises:
            RuntimeError - LDAP server unreachable or unexpected error
        """
        mode = getattr(config, "MODE", "DEV")
        if mode and mode.strip().upper() == "UAT":
            logger.info(f"MODE is UAT - bypassing LDAP password validation for '{username}' and returning True.")
            return True

        ldap_enabled = getattr(config, "LDAP_ENABLED", True)
        if not ldap_enabled or getattr(config, "DEV_MODE", False):
            logger.warning(
                f"LDAP is DISABLED / DEV_MODE - skipping Active Directory authentication for '{username}'."
            )
            return True

        if not password or not str(password).strip():
            logger.warning(f"LDAP auth rejected for '{username}': empty password supplied.")
            return False

        try:
            ldap_server = config.LDAP_SERVER
            if ldap_server.startswith("ldaps://"):
                ldap_server = ldap_server.replace("ldaps://", "")
            elif ldap_server.startswith("ldap://"):
                ldap_server = ldap_server.replace("ldap://", "")

            server = Server(ldap_server, port=config.LDAP_PORT, get_info=ALL, use_ssl=True, connect_timeout=5)
            domain = getattr(config, "DOMAIN", "CBI")
            conn = Connection(
                server,
                user=f"{domain}\\{username}",
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
            logger.warning(f"LDAP auth FAILED for '{username}': invalid credentials - {e}")
            return False

        except LDAPSocketOpenError as e:
            logger.error(f"LDAP server unreachable for '{username}': {e}")
            raise RuntimeError(
                "Unable to reach the authentication server. Please try again later or contact IT support."
            ) from e

        except LDAPException as e:
            logger.error(f"LDAP unexpected error for '{username}': {e}")
            raise RuntimeError(
                "An unexpected authentication error occurred. Please try again."
            ) from e

        except Exception as e:
            logger.error(f"LDAP auth unexpected exception for '{username}': {e}", exc_info=True)
            raise RuntimeError(
                "An unexpected authentication error occurred. Please try again."
            ) from e
