from ldap3 import Server, Connection, ALL, NTLM, ALL_ATTRIBUTES
from app.core import config

def ldap_authenticate(username: str, password: str) -> bool:
    """
    Try to authenticate a user against the LDAP server.
    Returns True if successful, False otherwise.
    """
    user_dn = f"CN={username},{config.LDAP_USER_DN}"  # change this based on your LDAP structure
    server = Server(config.LDAP_SERVER, get_info=ALL)

    try:
        # print(f'ladP CONNECTION :{username}', password)

        server = Server('ldaps://CBI.CO.IN', get_info=ALL , use_ssl= True)
        user = f'CBI\\{username}'
        conn = Connection(server,user=user,password=password,auto_bind=True)
        # print(f'ladP CONNECTION :{conn}')
        return True
    except Exception as e:
        print(f"LDAP auth failed for user: {e}")
        return False
