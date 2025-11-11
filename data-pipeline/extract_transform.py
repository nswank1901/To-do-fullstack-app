import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

# Step 1: Load the extracted CSV
df = pd.read_csv("../extracted_tasks.csv", parse_dates=["due_date", "created_at"])

# Quick check of data
# print("Dataframe head: ", df.head)
# print("\nDataframe info: ", df.info())
# print("\nDataframe description: \n", df.describe())

# Step 2: Transform / aggregate metrics
##############################
# Completed vs. Not Completed
completed_count  = df[df['completed'] == 1].shape[0]
not_completed_count = df[df['completed'] == 0].shape[0]

# Priority
high_count = df[df['priority'] == 'high'].shape[0]
medium_count = df[df['priority'] == 'medium'].shape[0]
low_count = df[df['priority'] == 'low'].shape[0]

# Overdue tasks
today = pd.Timestamp.today()
all_dates = pd.date_range(start=df["due_date"].min(), end=today)
overdue_cumulative = df[df["completed"] == 0].sort_values("due_date")

# For each day in the date range, this code counts how many tasks with due dates
#   on or before that day are still incomplete.
# This produces a cumulative total of overdue tasks over time.
cumulative_counts = [ (overdue_cumulative["due_date"] <= d).sum() for d in all_dates]



print(f"Completed: {completed_count}, Not completed: {not_completed_count}")
print(f"\nHigh priority: {high_count}, Medium Priority: {medium_count}, Low Priority: {low_count}")
print(f"\nOver due per day: {cumulative_counts}")

# Step 3: Create visualizations
##############################
# Completed vs. Not Completed
# Data for plotting
categories = ['Completed', 'Not completed']
counts = [completed_count, not_completed_count]

# Create bar chart
plt.bar(categories, counts, color=['green', 'red'])
plt.title('Tasks: Completed vs Not Completed')
plt.ylabel('Number of tasks')
plt.xlabel('Status')
#plt.show()
plt.savefig("completed_vs_not_completed.png")
plt.close()

##############################
# Priority
# Data for plotting
priority_categories = ['High', 'Medium', 'Low']
priority_counts = [high_count, medium_count, low_count]

# Create bar chart
plt.bar(priority_categories, priority_counts, color=['red', 'yellow', 'green'])
plt.title('Priority: High vs Med vs Low')
plt.ylabel('Number of tasks')
plt.xlabel('Status')
#plt.show()
plt.savefig("priority_counts.png")
plt.close()

##############################
# Overdue tasks
plt.figure(figsize=(10,6))
plt.plot(all_dates, cumulative_counts, marker="o")
plt.title("Overdue Tasks Over Time")
plt.xlabel("Date")
plt.ylabel("Number of Overdue Tasks")
plt.xticks(rotation=45)
plt.grid(True)
plt.tight_layout()
#plt.show()
plt.savefig("overdue_tasks.png")
plt.close()