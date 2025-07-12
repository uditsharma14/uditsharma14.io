import pandas as pd

# 1) Set your cutoff date here:
cutoff_date = "2024-05-21"

# 2) File paths
input_csv = "data/owid-covid-data.csv"
output_csv = "data/owid-covid-data_final_2023.csv"

# 3) Load and parse dates
df = pd.read_csv(input_csv, parse_dates=['date'])

# 4) Filter rows up to the cutoff
df_trimmed = df[df['date'] <= pd.to_datetime(cutoff_date)]

# 5) Save the trimmed CSV
df_trimmed.to_csv(output_csv, index=False)

print(f"Filtered data saved to {output_csv}. Total rows: {len(df_trimmed)}")
