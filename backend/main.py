# from fastapi import FastAPI, HTTPException
# from motor.motor_asyncio import AsyncIOMotorClient
# import os
# from typing import List, Optional
# from datetime import datetime, timedelta

# from dotenv import load_dotenv
# load_dotenv()

# app = FastAPI()

# from fastapi.middleware.cors import CORSMiddleware

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# MONGO_URI = "mongodb://scannerUser:StrongPassword123@localhost:27017/fileScanner?authSource=fileScanner"

# client = AsyncIOMotorClient(MONGO_URI)
# db = client.fileScanner

# @app.get("/api/access")
# async def list_files(
#     skip: int = 0,
#     limit: int = 100,
#     filename: str | None = None,
#     folder: str | None = None,
#     min_size: int | None = None,
#     max_size: int | None = None,
#     tier: str | None = None,   # 👈 HOT / WARM / COLD
#     max_days: int | None = None,  # 👈 Filter by days since user access (30, 60, 90, 180, 365, 730)
# ):
#     filter_q = {}

#     # 🔍 search by filename
#     if filename:
#         filter_q["fileName"] = {"$regex": filename, "$options": "i"}

#     # 📁 folder filter
#     if folder:
#         filter_q["fullPath"] = {"$regex": f"^{folder}", "$options": "i"}

#     # 📦 size filter
#     if min_size is not None or max_size is not None:
#         size_q = {}
#         if min_size is not None:
#             size_q["$gte"] = min_size
#         if max_size is not None:
#             size_q["$lte"] = max_size
#         filter_q["sizeBytes"] = size_q

#     # 🧊 tier filter (HOT / WARM / COLD)
#     if tier and tier.lower() != "all":
#         filter_q["accessClass"] = tier.upper()

#     # 📅 date filter based on effectiveUserAccessAt
#     if max_days is not None and max_days > 0:
#         # Calculate the cutoff date (max_days ago from now)
#         cutoff_date = datetime.utcnow() - timedelta(days=max_days)
#         # Filter files where effectiveUserAccessAt is within the last max_days
#         # Convert to ISO string format for MongoDB string date comparison
#         cutoff_date_str = cutoff_date.strftime("%Y-%m-%dT%H:%M:%S")
#         filter_q["effectiveUserAccessAt"] = {"$gte": cutoff_date_str}

#     cursor = (
#         db.FileMetaAccess
#         .find(filter_q, {"_id": 0})
#         .sort("fileName", 1)
#         .skip(skip)
#         .limit(limit)
#     )

#     docs = await cursor.to_list(length=limit)
#     return docs


# @app.get("/api/access/{file_id}")
# async def get_file(file_id: str):
#     doc = await db.FileMetaAccess.find_one({"fileId": file_id}, {"_id": 0})
#     if not doc:
#         raise HTTPException(status_code=404, detail="File not found")
#     return doc

# @app.get("/api/duplicates")
# async def list_duplicates(skip: int = 0, limit: int = 100):
#     docs = await db.DuplicateFiles.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(length=limit)
#     return docs

# @app.get("/deduplication")
# async def get_deduplication_summary():
#     # Get duplicate files count
#     duplicate_count = await db.DuplicateFiles.count_documents({})
    
#     # Get latest daily summary for other metrics
#     latest_summary = await db.TrendDailySummary.find_one({}, {"_id": 0}, sort=[("date", -1)])
    
#     if not latest_summary:
#         # Return default structure if no data
#         return {
#             "totalFiles": 0,
#             "duplicateFiles": 0,
#             "duplicateGroups": 0,
#             "totalSizeBytes": 0,
#             "totalDuplicateSize": 0,
#             "hotFiles": 0,
#             "warmFiles": 0,
#             "coldFiles": 0
#         }
    
#     return {
#         "totalFiles": latest_summary.get("totalFiles", 0),
#         "duplicateFiles": latest_summary.get("duplicateFiles", 0),
#         "duplicateGroups": duplicate_count,
#         "totalSizeBytes": latest_summary.get("totalSizeBytes", 0),
#         "totalDuplicateSize": latest_summary.get("TotalDuplicateSize", 0),
#         "hotFiles": latest_summary.get("hotFiles", 0),
#         "warmFiles": latest_summary.get("warmFiles", 0),
#         "coldFiles": latest_summary.get("coldFiles", 0)
#     }

# @app.get("/api/duplicates/{fingerprint}")
# async def get_duplicate_group(fingerprint: str):
#     doc = await db.DuplicateFiles.find_one({"fingerprint": fingerprint}, {"_id": 0})
#     if not doc:
#         raise HTTPException(status_code=404, detail="Duplicate group not found")
#     return doc

# @app.get("/api/heatmap")
# async def get_heatmap(skip: int = 0, limit: int = 100):
#     docs = await db.TrendFolderHeatmap.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(length=limit)
#     return docs

# @app.get("/api/trends/daily")
# async def list_trends(skip: int = 0, limit: int = 100):
#     docs = await db.TrendDailySummary.find({}, {"_id": 0}).sort("date", -1).skip(skip).limit(limit).to_list(length=limit)
#     return docs

# @app.get("/api/trends/daily/{date}")
# async def get_trend_day(date: str):
#     doc = await db.TrendDailySummary.find_one({"date": date}, {"_id": 0})
#     if not doc:
#         raise HTTPException(status_code=404, detail="No summary found for that date")
#     return doc

# @app.get("/api/health")
# def health():
#     return {"status": "ok"}


from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = "mongodb://scannerUser:StrongPassword123@localhost:27017/fileScanner?authSource=fileScanner"

client = AsyncIOMotorClient(MONGO_URI)
db = client.fileScanner


# ---------------- FILE ACCESS API ---------------- #

@app.get("/api/access")
async def list_files(
    skip: int = 0,
    limit: int = 100,
    filename: Optional[str] = None,
    folder: Optional[str] = None,
    min_size: Optional[int] = None,
    max_size: Optional[int] = None,
    tier: Optional[str] = None,
    max_days: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):

    filter_q = {}

    # filename search
    if filename:
        filter_q["fileName"] = {"$regex": filename, "$options": "i"}

    # folder filter
    if folder:
        filter_q["fullPath"] = {"$regex": f"^{folder}", "$options": "i"}

    # size filter
    if min_size is not None or max_size is not None:
        size_q = {}

        if min_size is not None:
            size_q["$gte"] = min_size

        if max_size is not None:
            size_q["$lte"] = max_size

        filter_q["sizeBytes"] = size_q

    # HOT / WARM / COLD filter
    if tier and tier.lower() != "all":
        filter_q["accessClass"] = tier.upper()

    # filter using last X days
    if max_days is not None and max_days > 0:
        cutoff_date = datetime.utcnow() - timedelta(days=max_days)
        filter_q["effectiveUserAccessAt"] = {"$gte": cutoff_date}

    # filter using date range
    if start_date or end_date:

        date_filter = {}

        try:
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date)

            if end_date:
                date_filter["$lte"] = datetime.fromisoformat(end_date)

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        filter_q["effectiveUserAccessAt"] = date_filter

    cursor = (
        db.FileMetaAccess
        .find(filter_q, {"_id": 0})
        .sort("fileName", 1)
        .skip(skip)
        .limit(limit)
    )

    docs = await cursor.to_list(length=limit)

    return docs


# ---------------- FILE DETAIL ---------------- #

@app.get("/api/access/{file_id}")
async def get_file(file_id: str):

    doc = await db.FileMetaAccess.find_one(
        {"fileId": file_id},
        {"_id": 0}
    )

    if not doc:
        raise HTTPException(status_code=404, detail="File not found")

    return doc


# ---------------- DUPLICATES ---------------- #

@app.get("/api/duplicates")
async def list_duplicates(skip: int = 0, limit: int = 100):

    docs = await db.DuplicateFiles.find(
        {},
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(length=limit)

    return docs


@app.get("/api/duplicates/{fingerprint}")
async def get_duplicate_group(fingerprint: str):

    doc = await db.DuplicateFiles.find_one(
        {"fingerprint": fingerprint},
        {"_id": 0}
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Duplicate group not found")

    return doc


# ---------------- DEDUPLICATION SUMMARY ---------------- #

@app.get("/deduplication")
async def get_deduplication_summary():

    duplicate_count = await db.DuplicateFiles.count_documents({})

    latest_summary = await db.TrendDailySummary.find_one(
        {},
        {"_id": 0},
        sort=[("date", -1)]
    )

    if not latest_summary:
        return {
            "totalFiles": 0,
            "duplicateFiles": 0,
            "duplicateGroups": 0,
            "totalSizeBytes": 0,
            "totalDuplicateSize": 0,
            "hotFiles": 0,
            "warmFiles": 0,
            "coldFiles": 0
        }

    return {
        "totalFiles": latest_summary.get("totalFiles", 0),
        "duplicateFiles": latest_summary.get("duplicateFiles", 0),
        "duplicateGroups": duplicate_count,
        "totalSizeBytes": latest_summary.get("totalSizeBytes", 0),
        "totalDuplicateSize": latest_summary.get("TotalDuplicateSize", 0),
        "hotFiles": latest_summary.get("hotFiles", 0),
        "warmFiles": latest_summary.get("warmFiles", 0),
        "coldFiles": latest_summary.get("coldFiles", 0)
    }


# ---------------- HEATMAP ---------------- #

@app.get("/api/heatmap")
async def get_heatmap(skip: int = 0, limit: int = 100):

    docs = await db.TrendFolderHeatmap.find(
        {},
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(length=limit)

    return docs


# ---------------- DAILY TRENDS ---------------- #

@app.get("/api/trends/daily")
async def list_trends(skip: int = 0, limit: int = 100):

    docs = await db.TrendDailySummary.find(
        {},
        {"_id": 0}
    ).sort("date", -1).skip(skip).limit(limit).to_list(length=limit)

    return docs


@app.get("/api/trends/daily/{date}")
async def get_trend_day(date: str):

    doc = await db.TrendDailySummary.find_one(
        {"date": date},
        {"_id": 0}
    )

    if not doc:
        raise HTTPException(status_code=404, detail="No summary found for that date")

    return doc


# ---------------- HEALTH CHECK ---------------- #

@app.get("/api/health")
def health():

    return {"status": "ok"}