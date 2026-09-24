from ldap3 import Server, Connection, ALL
from app.core import config

def ldap_authenticate(username: str, password: str) -> bool:
    """
    Try to authenticate a user against the LDAP server.
    Returns True if successful, False otherwise.
    """
    if not username or not password:
        return False

    ldap_host = config.LDAP_SERVER or "ldaps://CBI.CO.IN"
    try:
        server = Server(ldap_host, get_info=ALL, use_ssl=ldap_host.startswith("ldaps"), connect_timeout=3)
        user = f'CBI\\{username}'
        conn = Connection(server, user=user, password=password, auto_bind=True, receive_timeout=3)
        return True
    except Exception as e:
        print(f"LDAP auth note for {username}: {e}")
        return False
