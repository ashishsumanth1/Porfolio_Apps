"""
Process Census 2021 data into JSON for the Ward Explorer
"""
import pandas as pd
import json
from pathlib import Path

# Data paths
DATA_DIR = Path("/Users/ashishsumanthbanda/Documents/Subreddit/census-2021/Data")
OUTPUT_PATH = Path("/Users/ashishsumanthbanda/Documents/Subreddit/web/public/data/ward_data.json")

# Load the CSV files
print("Loading qualification data...")
qual_df = pd.read_csv(DATA_DIR / "qualification for electro.csv")
print(f"  {len(qual_df)} rows")

print("Loading economic activity data...")
eco_df = pd.read_csv(DATA_DIR / "eco for electro.csv")
print(f"  {len(eco_df)} rows")

print("Loading occupation data...")
occ_df = pd.read_csv(DATA_DIR / "occupation for electro.csv")
print(f"  {len(occ_df)} rows")

# Create pivot tables
print("\nCreating pivot tables...")

# Qualification pivot - use simplified names
qual_pivot = qual_df.pivot_table(
    index=['Electoral wards and divisions Code', 'Electoral wards and divisions'],
    columns='Highest level of qualification (8 categories) Code',
    values='Observation',
    aggfunc='sum'
).reset_index()

# Rename qualification columns
qual_pivot.columns = ['code', 'name', 'does_not_apply', 'no_qual', 'level1', 'level2', 'apprenticeship', 'level3', 'level4', 'other']

# Economic activity pivot
eco_pivot = eco_df.pivot_table(
    index=['Electoral wards and divisions Code', 'Electoral wards and divisions'],
    columns='Economic activity status last week (3 categories) Code',
    values='Observation',
    aggfunc='sum'
).reset_index()
eco_pivot.columns = ['code', 'name', 'eco_does_not_apply', 'employed', 'not_employed']

# Occupation pivot
occ_pivot = occ_df.pivot_table(
    index=['Electoral wards and divisions Code', 'Electoral wards and divisions'],
    columns='Occupation (current) (10 categories) Code',
    values='Observation',
    aggfunc='sum'
).reset_index()
occ_pivot.columns = ['code', 'name', 'occ_does_not_apply', 'managers', 'professional', 'associate', 'admin', 'skilled', 'caring', 'sales', 'process', 'elementary']

# Merge all data
print("Merging datasets...")
merged = qual_pivot.merge(eco_pivot[['code', 'employed', 'not_employed']], on='code')
merged = merged.merge(occ_pivot[['code', 'managers', 'professional', 'associate', 'admin', 'skilled', 'caring', 'sales', 'process', 'elementary']], on='code')

# Calculate total population (from qualification data, excluding "does not apply" which is under 16)
merged['population'] = merged['no_qual'] + merged['level1'] + merged['level2'] + merged['level3'] + merged['level4'] + merged['apprenticeship'] + merged['other']

# Add a simple region based on ward code prefix (this is approximate)
# E05 codes are for England wards
def get_region(code, name):
    name_lower = name.lower()
    # London boroughs
    london_keywords = ['westminster', 'kensington', 'chelsea', 'camden', 'islington', 'hackney', 
                       'tower hamlets', 'greenwich', 'lewisham', 'southwark', 'lambeth', 'wandsworth',
                       'hammersmith', 'fulham', 'brent', 'ealing', 'hounslow', 'richmond', 'kingston',
                       'merton', 'sutton', 'croydon', 'bromley', 'bexley', 'barking', 'dagenham',
                       'havering', 'redbridge', 'newham', 'waltham', 'haringey', 'enfield', 'barnet',
                       'harrow', 'hillingdon', 'city of london', 'docklands', 'woolwich', 'eltham',
                       'blackheath', 'charlton', 'plumstead', 'thamesmead', 'abbey wood', 'east greenwich',
                       'greenwich park', 'greenwich creekside', 'kidbrooke']
    
    north_west = ['manchester', 'liverpool', 'bolton', 'salford', 'wigan', 'stockport', 'oldham',
                  'rochdale', 'bury', 'blackburn', 'blackpool', 'preston', 'burnley', 'chorley',
                  'lancaster', 'warrington', 'halton', 'knowsley', 'sefton', 'wirral', 'cheshire',
                  'cumbria', 'carlisle', 'barrow']
    
    yorkshire = ['leeds', 'sheffield', 'bradford', 'hull', 'york', 'wakefield', 'huddersfield',
                 'doncaster', 'rotherham', 'barnsley', 'halifax', 'dewsbury', 'scarborough',
                 'harrogate', 'middlesbrough', 'hartlepool', 'stockton', 'darlington', 'redcar']
    
    west_midlands = ['birmingham', 'coventry', 'wolverhampton', 'dudley', 'walsall', 'sandwell',
                     'solihull', 'worcester', 'hereford', 'stoke', 'stafford', 'telford', 'shrewsbury']
    
    east_midlands = ['nottingham', 'derby', 'leicester', 'lincoln', 'northampton', 'corby',
                     'loughborough', 'mansfield', 'chesterfield']
    
    south_west = ['bristol', 'plymouth', 'exeter', 'bath', 'gloucester', 'cheltenham', 'swindon',
                  'bournemouth', 'poole', 'taunton', 'torquay', 'truro', 'cornwall']
    
    south_east = ['brighton', 'southampton', 'portsmouth', 'reading', 'oxford', 'milton keynes',
                  'slough', 'canterbury', 'maidstone', 'guildford', 'crawley', 'hastings', 'eastbourne']
    
    east = ['cambridge', 'norwich', 'ipswich', 'colchester', 'chelmsford', 'peterborough',
            'luton', 'watford', 'stevenage', 'st albans', 'basildon', 'southend', 'thurrock']
    
    north_east = ['newcastle', 'sunderland', 'durham', 'gateshead', 'south shields', 'tynemouth',
                  'blyth', 'cramlington', 'washington', 'consett', 'bishop auckland']
    
    for kw in london_keywords:
        if kw in name_lower:
            return 'London'
    for kw in north_west:
        if kw in name_lower:
            return 'North West'
    for kw in yorkshire:
        if kw in name_lower:
            return 'Yorkshire'
    for kw in west_midlands:
        if kw in name_lower:
            return 'West Midlands'
    for kw in east_midlands:
        if kw in name_lower:
            return 'East Midlands'
    for kw in south_west:
        if kw in name_lower:
            return 'South West'
    for kw in south_east:
        if kw in name_lower:
            return 'South East'
    for kw in east:
        if kw in name_lower:
            return 'East of England'
    for kw in north_east:
        if kw in name_lower:
            return 'North East'
    
    # Default by code prefix patterns (rough approximation)
    if code.startswith('E050006') or code.startswith('E050007'):
        return 'North West'
    elif code.startswith('E050008') or code.startswith('E050009'):
        return 'Yorkshire'
    elif code.startswith('E05001'):
        return 'East Midlands'
    elif code.startswith('E05002'):
        return 'West Midlands'
    elif code.startswith('E05003'):
        return 'South West'
    elif code.startswith('E05004'):
        return 'South East'
    elif code.startswith('E05005'):
        return 'East of England'
    
    return 'England'

merged['region'] = merged.apply(lambda row: get_region(row['code'], row['name']), axis=1)

# Convert to list of dicts
print("Converting to JSON format...")
wards = []
for _, row in merged.iterrows():
    ward = {
        'code': row['code'],
        'name': row['name'],
        'region': row['region'],
        'level1': int(row['level1']) if pd.notna(row['level1']) else 0,
        'level2': int(row['level2']) if pd.notna(row['level2']) else 0,
        'level3': int(row['level3']) if pd.notna(row['level3']) else 0,
        'level4': int(row['level4']) if pd.notna(row['level4']) else 0,
        'noQual': int(row['no_qual']) if pd.notna(row['no_qual']) else 0,
        'apprenticeship': int(row['apprenticeship']) if pd.notna(row['apprenticeship']) else 0,
        'other': int(row['other']) if pd.notna(row['other']) else 0,
        'managers': int(row['managers']) if pd.notna(row['managers']) else 0,
        'professional': int(row['professional']) if pd.notna(row['professional']) else 0,
        'associate': int(row['associate']) if pd.notna(row['associate']) else 0,
        'admin': int(row['admin']) if pd.notna(row['admin']) else 0,
        'skilled': int(row['skilled']) if pd.notna(row['skilled']) else 0,
        'caring': int(row['caring']) if pd.notna(row['caring']) else 0,
        'sales': int(row['sales']) if pd.notna(row['sales']) else 0,
        'process': int(row['process']) if pd.notna(row['process']) else 0,
        'elementary': int(row['elementary']) if pd.notna(row['elementary']) else 0,
        'employed': int(row['employed']) if pd.notna(row['employed']) else 0,
        'notEmployed': int(row['not_employed']) if pd.notna(row['not_employed']) else 0,
        'population': int(row['population']) if pd.notna(row['population']) else 0,
    }
    wards.append(ward)

# Sort by name
wards.sort(key=lambda x: x['name'])

print(f"\nProcessed {len(wards)} wards")

# Show some examples
print("\nSample wards:")
for ward in wards[:5]:
    emp_rate = round(ward['employed'] / (ward['employed'] + ward['notEmployed']) * 100) if (ward['employed'] + ward['notEmployed']) > 0 else 0
    print(f"  {ward['name']} ({ward['region']}): pop={ward['population']:,}, emp_rate={emp_rate}%")

# Find Greenwich wards
print("\nGreenwich wards:")
greenwich_wards = [w for w in wards if 'greenwich' in w['name'].lower()]
for ward in greenwich_wards:
    emp_rate = round(ward['employed'] / (ward['employed'] + ward['notEmployed']) * 100) if (ward['employed'] + ward['notEmployed']) > 0 else 0
    print(f"  {ward['name']}: pop={ward['population']:,}, employed={ward['employed']:,}, emp_rate={emp_rate}%")

# Ensure output directory exists
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Save to JSON
print(f"\nSaving to {OUTPUT_PATH}...")
with open(OUTPUT_PATH, 'w') as f:
    json.dump(wards, f)

print("Done!")

# Also print stats
regions = {}
for ward in wards:
    reg = ward['region']
    if reg not in regions:
        regions[reg] = 0
    regions[reg] += 1

print("\nWards by region:")
for reg, count in sorted(regions.items(), key=lambda x: -x[1]):
    print(f"  {reg}: {count}")
