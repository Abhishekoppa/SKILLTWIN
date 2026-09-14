# SkillTwin Backend

FastAPI backend for SkillTwin.

## Setup

1. `python -m venv venv`
2. `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
3. `pip install -r requirements.txt`
4. Set up `.env` with database URL and other credentials.
5. Run migrations: `alembic upgrade head`

## Run

`uvicorn app.main:app --reload`
