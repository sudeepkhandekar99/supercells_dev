from fastapi import APIRouter, File, UploadFile, HTTPException
from services.cleaner import clean_onesite_data
import pandas as pd
from io import BytesIO


router = APIRouter()

@router.post("/onesite/")
async def upload_onesite(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".xls"):
        raise HTTPException(status_code=400, detail="Only .xls files are supported for OneSite")

    try:
        cleaned_df = clean_onesite_data(file)
        # Replace NaN/NaT with None for JSON safety
        cleaned_df = cleaned_df.where(pd.notnull(cleaned_df), None)
        return {
            "columns": cleaned_df.columns.tolist(),
            "data": cleaned_df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


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