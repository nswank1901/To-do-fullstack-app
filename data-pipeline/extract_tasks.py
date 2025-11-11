import mysql.connector
import pandas as pd
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Connect to the database
conn = mysql.connector.connect(
    host= os.getenv("DB_HOST"),
    user = os.getenv("DB_USER"),
    password = os.getenv("DB_PASSWORD"),
    database = os.getenv("DB_NAME")
)

# Create a cursor and execute query
cursor = conn.cursor(dictionary=True)
query = "SELECT * FROM tasks"
cursor.execute(query)

# Fetch results
tasks = cursor.fetchall()

# Convert to pandas DataFrame and save
df = pd.DataFrame(tasks)
df.to_csv("extracted_tasks.csv", index=False)

# Close connection
cursor.close()
conn.close()

print("Data extracted successfully! Saved to extracted_tasks.csv")