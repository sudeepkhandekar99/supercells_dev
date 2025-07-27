import pandas as pd
import re
from io import BytesIO
from fastapi import UploadFile

name_mapping = {
    'Sarbin Towers': 'Sarbin',
    'Richman Towers': 'Richman',
    'Park Marconi': 'Marconi',
    'Jubilee Maycroft Apartments LP': 'Maycroft',
    'Jubilee Ontario Apartments LP': 'Ontario',
    'The Fuller': 'Fuller',
    'Ritz Apartments': 'Ritz'
}

def clean_onesite_data(file: UploadFile) -> pd.DataFrame:
    df = pd.read_excel(BytesIO(file.file.read()), engine='xlrd')

    # Extract property name
    cell_value = str(df.iloc[0, 3]) 
    prop_name = "unknown"
    if "Jubilee Housing, Inc. - " in cell_value:
        prop_name = cell_value.split("Jubilee Housing, Inc. - ")[1].strip()
    prop_name = name_mapping.get(prop_name, prop_name)

    # Clean and format dataframe
    df = df.drop(df.index[:8])
    df.reset_index(drop=True, inplace=True)
    df.dropna(subset=[df.columns[0]], inplace=True)
    df["Property"] = prop_name

    df = df.rename(columns={
        "Unnamed: 0":"Unit", 
        "Unnamed: 2": "Name", 
        "Unnamed: 4":"DOB", 
        "Unnamed: 5":"Gender", 
        "Unnamed: 6":"Marital Status", 
        "Unnamed: 7":"Ethnic Origin", 
        "Unnamed: 9":"Household Status"
    })

    columns_to_keep = [
        'Unit', 'Name', 'DOB', 'Gender',
        'Marital Status', 'Household Status', 'Property'
    ]
    df = df[columns_to_keep]

    df = df.map(lambda cell: re.sub(r'\\.*|\n.*','',str(cell)).strip() if isinstance(cell, str) else cell)

    df.drop_duplicates(inplace=True)
    df["DOB"] = pd.to_datetime(df["DOB"], errors="coerce")
    df["Age"] = (pd.to_datetime("today") - df["DOB"]).dt.days // 365
    df["Unit"] = df["Property"] + " " + df["Unit"].astype(str)

    detailed_bins = [0, 17, 24, 54, 64, float('inf')]
    detailed_labels = ['0-17', '18-24', '25-54', '55-64', '65+']
    df['Age Group Detailed'] = pd.cut(df['Age'], bins=detailed_bins, labels=detailed_labels, right=False)

    general_bins = [0, 17, 64, float('inf')]
    general_labels = ['0-17', '18-64', '65+']
    df['Age Group General'] = pd.cut(df['Age'], bins=general_bins, labels=general_labels, right=False)

    return df