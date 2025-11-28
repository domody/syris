import socket

def get_ip_address():
    try:
        return socket.gethostbyname(socket.gethostname())
    except:
        return "Unknown"

