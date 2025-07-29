from fastapi import APIRouter, File, UploadFile, HTTPException
from services.cleaner import clean_onesite_data
import pandas as pd
from io import BytesIO
from typing import List
import numpy as np


router = APIRouter()


@router.post("/onesite/")
async def upload_onesite(files: List[UploadFile] = File(...)):
    cleaned_dfs = []

    for file in files:
        if not file.filename.lower().endswith(".xls"):
            raise HTTPException(status_code=400, detail="Only .xls files are supported for OneSite")
        try:
            cleaned_df = clean_onesite_data(file)
            cleaned_dfs.append(cleaned_df)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing {file.filename}: {str(e)}")

    # Merge all cleaned data
    combined_df = pd.concat(cleaned_dfs, ignore_index=True)

    # Convert all out-of-range values (NaN, NaT, inf) to None
    combined_df = combined_df.astype(object).where(pd.notnull(combined_df), None)

    return {
        "columns": combined_df.columns.tolist(),
        "data": combined_df.to_dict(orient="records")
    }


@router.post("/apricot/")
async def upload_apricot(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported for Apricot")

    try:
        df = pd.read_excel(BytesIO(await file.read()), engine='openpyxl')

        # Replace NaN with None for JSON compatibility
        df = df.where(pd.notnull(df), None)

        return {
            "columns": df.columns.tolist(),
            "data": df.to_dict(orient="records")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Apricot file: {str(e)}")