import pandas as pd
import matplotlib.pyplot as plt

# Target cities and corresponding CBSA names from the EPA dataset
target_cities = {
    "New York, NY": "New York-Newark-Jersey City, NY-NJ-PA",
    "Los Angeles, CA": "Los Angeles-Long Beach-Anaheim, CA",
    "Chicago, IL": "Chicago-Naperville-Elgin, IL-IN-WI",
    "Austin, TX": "Austin-Round Rock-Georgetown, TX",
    "Minneapolis, MN": "Minneapolis-St. Paul-Bloomington, MN-WI"
}

# Load EPA scores
epa_df = pd.read_csv("epa_scores.csv", delimiter="\t")  # Use sep="\t" if tab-separated
epa_df.columns = epa_df.columns.str.strip()  # Clean up any whitespace

# Group by CBSA_Name to calculate average walkability per urban area
grouped = epa_df.groupby["CBSA_Name"]["NatWalkInd"].mean().reset_index()
grouped.columns = ["CBSA_Name", "Average_EPA_Walkability"]

# Map to our target cities
data = []
for city_label, cbsa_name in target_cities.items():
    row = grouped[grouped["CBSA_Name"] == cbsa_name]
    if not row.empty:
        score = row["Average_EPA_Walkability"].values[0]
        data.append((city_label, score))
    else:
        print(f"⚠️ Could not find CBSA match for: {city_label}")

# Convert to DataFrame
df = pd.DataFrame(data, columns=["City", "Score"])

# Normalize scores to 0–1 for comparison (optional)
df["Normalized_Score"] = (df["Score"] - df["Score"].min()) / (df["Score"].max() - df["Score"].min())

# Plot
plt.figure(figsize=(10, 6))
bars = plt.bar(df["City"], df["Normalized_Score"], color="mediumpurple")
plt.title("Normalized EPA Walkability Scores by City")
plt.ylabel("Normalized Walkability (0–1)")
plt.xticks(rotation=45, ha="right")

# Annotate actual values
for bar, score in zip(bars, df["Score"]):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
             f"{score:.2f}", ha="center", va="bottom", fontsize=9)

# Save figure
plt.tight_layout()
plt.savefig("epa_walkability_comparison.png", dpi=300)
print("✅ Saved figure as 'epa_walkability_comparison.png'")
