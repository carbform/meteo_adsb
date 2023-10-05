#%%
import requests
import psycopg2

def log_dump1090_data():
    conn = psycopg2.connect(database='dump1090', user='postgres', password='password')
    cur = conn.cursor()

    cur.execute('CREATE TABLE IF NOT EXISTS dump1090_data (id SERIAL PRIMARY KEY, data JSON)')

    response = requests.get('http://10.197.12.30:8080/data.json')
    data = response.json()

    cur.execute('INSERT INTO dump1090_data (data) VALUES (%s)', (data,))

    conn.commit()
    cur.close()
    conn.close()

if __name__ == '__main__':
    log_dump1090_data()
# %%
# %%
