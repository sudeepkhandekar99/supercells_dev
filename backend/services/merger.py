import pandas as pd
from typing import List, Dict
import re

def normalize(s):
    if not isinstance(s, str):
        return ""
    return re.sub(r'\W+', '', s.lower().strip())

def process_dynamic_merging(apricot_data, onesite_data, merge_columns):
    apricot_df = pd.DataFrame(apricot_data)
    onesite_df = pd.DataFrame(onesite_data)
    merge_columns = [p.dict() for p in merge_columns]

    # Normalize DOB fields if present
    if 'DOB' in onesite_df.columns:
        onesite_df["Normalized_DOB"] = pd.to_datetime(onesite_df["DOB"], errors="coerce")
    if 'Date of Birth' in apricot_df.columns:
        apricot_df["Normalized_DOB"] = pd.to_datetime(apricot_df["Date of Birth"], errors="coerce")

    name_matched_pairs = []
    dob_matched_pairs = []

    # Filter only valid merge pairs
    valid_pairs = [p for p in merge_columns if p["onesite"] and p["apricot"]]

    # Determine if name or DOB logic is needed
    has_name_match = any(p["onesite"] == "Name" for p in valid_pairs)
    has_dob_match = any(
        (p["onesite"] == "DOB" and p["apricot"] == "Date of Birth") for p in valid_pairs
    )

    if has_name_match:
        for idx1, full_name in onesite_df['Name'].items():
            norm_full = normalize(full_name)
            matches = []

            for idx2, row in apricot_df.iterrows():
                first = normalize(row.get('First'))
                middle = normalize(row.get('Middle'))
                last = normalize(row.get('Last'))

                match_score = 0
                if first and first in norm_full:
                    match_score += 1
                if middle and middle in norm_full:
                    match_score += 1
                if last and last in norm_full:
                    match_score += 1

                if match_score > 1:
                    matches.append((idx2, match_score))

            if len(matches) == 1:
                name_matched_pairs.append((idx1, matches[0][0]))

    if has_dob_match:
        for idx1, onesite_row in onesite_df.iterrows():
            dob = onesite_row.get("Normalized_DOB")
            if pd.isna(dob):
                continue

            dob_matches = apricot_df[apricot_df["Normalized_DOB"] == dob]

            if len(dob_matches) == 1:
                dob_matched_pairs.append((idx1, dob_matches.index[0]))

            elif len(dob_matches) > 1:
                norm_full = normalize(onesite_row.get("Name", ""))
                best_match = None
                best_score = 0

                for idx2, row in dob_matches.iterrows():
                    first = normalize(row.get('First'))
                    middle = normalize(row.get('Middle'))
                    last = normalize(row.get('Last'))

                    match_score = 0
                    if first and first in norm_full:
                        match_score += 1
                    if middle and middle in norm_full:
                        match_score += 1
                    if last and last in norm_full:
                        match_score += 1

                    if match_score > best_score:
                        best_match = idx2
                        best_score = match_score

                if best_match is not None and best_score > 1:
                    dob_matched_pairs.append((idx1, best_match))

    def make_merged(pairs):
        o = onesite_df.loc[[i[0] for i in pairs]].reset_index(drop=True)
        a = apricot_df.loc[[i[1] for i in pairs]].reset_index(drop=True)
        return pd.concat([o, a], axis=1)

    df_name_matched = make_merged(name_matched_pairs) if name_matched_pairs else pd.DataFrame()
    df_dob_matched = make_merged(dob_matched_pairs) if dob_matched_pairs else pd.DataFrame()

    matched_onesite_idx = set(i[0] for i in name_matched_pairs + dob_matched_pairs)
    matched_apricot_idx = set(i[1] for i in name_matched_pairs + dob_matched_pairs)

    onesite_unmatched = onesite_df.loc[~onesite_df.index.isin(matched_onesite_idx)].reset_index(drop=True)
    apricot_unmatched = apricot_df.loc[~apricot_df.index.isin(matched_apricot_idx)].reset_index(drop=True)

    apricot_empty = pd.DataFrame(columns=apricot_df.columns, index=onesite_unmatched.index)
    onesite_empty = pd.DataFrame(columns=onesite_df.columns, index=apricot_unmatched.index)

    df_unmatched_1 = pd.concat([onesite_unmatched, apricot_empty], axis=1)
    df_unmatched_2 = pd.concat([onesite_empty, apricot_unmatched], axis=1)

    df_unmatched_1["Matched in both"] = False
    df_unmatched_1["Unmatched Apricot"] = False
    df_unmatched_1["Unmatched Onesite"] = True

    df_unmatched_2["Matched in both"] = False
    df_unmatched_2["Unmatched Apricot"] = True
    df_unmatched_2["Unmatched Onesite"] = False

    df_unmatched = pd.concat([df_unmatched_1, df_unmatched_2], ignore_index=True)

    # Final global merge
    df_global = pd.concat(
        [
            add_match_status(df_name_matched, matched_both=True),
            add_match_status(df_dob_matched, matched_both=True),
            df_unmatched,
        ],
        ignore_index=True,
    )

    rename_map = {
        "Name": "Original Names in Onesite",
        "First": "Clean First Name (Apricot)",
        "Middle": "Clean Middle Name (Apricot)",
        "Last": "Clean Last Name (Apricot)",
        "Property": "Building (Onesite)",
        "Building": "Building (Apricot)",
        "Unit": "Unit (Onesite)",
        "DOB": "Date of Birth (Onesite)",
        "Date of Birth": "Date of Birth (Apricot)",
        "Record ID": "Record ID (Apricot)",
        "Jubilee Housing Resident?": "Jubilee Housing Resident?",
        "Matched in both": "Matched in both",
        "Unmatched Apricot": "Unmatched Apricot",
        "Unmatched Onesite": "Unmatched Onesite",
    }

    df_global = df_global[[col for col in rename_map if col in df_global.columns]]
    df_global.rename(columns=rename_map, inplace=True)

    # Final clean-up
    df_name_matched = df_name_matched.where(pd.notnull(df_name_matched), None)
    df_dob_matched = df_dob_matched.where(pd.notnull(df_dob_matched), None)
    df_unmatched = df_unmatched.where(pd.notnull(df_unmatched), None)
    df_global = df_global.where(pd.notnull(df_global), None)

    return df_name_matched, df_dob_matched, df_unmatched, df_global


def add_match_status(df, matched_both=False, unmatched_apricot=False, unmatched_onesite=False):
    if df.empty:
        return df
    df["Matched in both"] = matched_both
    df["Unmatched Apricot"] = unmatched_apricot
    df["Unmatched Onesite"] = unmatched_onesite
    return df