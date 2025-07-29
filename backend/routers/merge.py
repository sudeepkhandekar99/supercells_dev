from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from services.merger import process_dynamic_merging

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