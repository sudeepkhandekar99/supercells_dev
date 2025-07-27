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

@router.post("/")
async def merge_records(request: MergeRequest):
    try:
        df_name, df_dob, df_unmatched, df_global = process_dynamic_merging(
            apricot_data=request.apricot_data,
            onesite_data=request.onesite_data,
            merge_columns=request.merge_columns,
        )

        return {
            "matched": df_global.to_dict(orient="records"),
            "unmatched": df_unmatched.to_dict(orient="records"),
            "name_matched": df_name.to_dict(orient="records") if not df_name.empty else [],
            "dob_matched": df_dob.to_dict(orient="records") if not df_dob.empty else [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))