from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from services.merger import process_dynamic_merging
from fastapi.responses import StreamingResponse
from io import BytesIO
import zipfile
import datetime

router = APIRouter()

class MergeColumnPair(BaseModel):
    onesite: str
    apricot: str

class MergeRequest(BaseModel):
    apricot_data: List[Dict[str, Any]]
    onesite_data: List[Dict[str, Any]]
    merge_columns: List[MergeColumnPair]

def safe_json_df(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Converts DataFrame to JSON-safe list of dicts (replacing NaN, NaT, inf, etc.)
    """
    return df.astype(object).where(pd.notnull(df), None).to_dict(orient="records")

@router.post("/")
async def merge_records(request: MergeRequest):
    try:
        df_name, df_dob, df_unmatched, df_global = process_dynamic_merging(
            apricot_data=request.apricot_data,
            onesite_data=request.onesite_data,
            merge_columns=request.merge_columns,
        )

        return {
            "matched": safe_json_df(df_global),
            "unmatched": safe_json_df(df_unmatched),
            "name_matched": safe_json_df(df_name) if not df_name.empty else [],
            "dob_matched": safe_json_df(df_dob) if not df_dob.empty else [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# Export CSV API

class ExportRequest(BaseModel):
    matched: List[Dict[str, Any]]
    unmatched: List[Dict[str, Any]]
    name_matched: List[Dict[str, Any]]
    dob_matched: List[Dict[str, Any]]

@router.post("/export-csv/")
async def export_csv_files(data: ExportRequest):
    try:
        # Convert lists of dicts to DataFrames
        matched_df = pd.DataFrame(data.matched)
        unmatched_df = pd.DataFrame(data.unmatched)
        name_df = pd.DataFrame(data.name_matched)
        dob_df = pd.DataFrame(data.dob_matched)

        # Create a BytesIO zip stream
        zip_stream = BytesIO()
        with zipfile.ZipFile(zip_stream, "w", zipfile.ZIP_DEFLATED) as zipf:
            files = {
                "matched.csv": matched_df,
                "unmatched.csv": unmatched_df,
                "name_matched.csv": name_df,
                "dob_matched.csv": dob_df
            }

            for filename, df in files.items():
                buffer = BytesIO()
                df.to_csv(buffer, index=False)
                buffer.seek(0)
                zipf.writestr(filename, buffer.read())

        zip_stream.seek(0)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        return StreamingResponse(
            zip_stream,
            media_type="application/x-zip-compressed",
            headers={"Content-Disposition": f"attachment; filename=merged_data_{timestamp}.zip"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export CSVs: {str(e)}")
