import datetime

def get_time():
    now = datetime.datetime.now()
    return now.strftime("%H:%M:%S")