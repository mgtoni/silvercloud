# api/index.py

print("API: Script started.") # ADD THIS LINE

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import supabase
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

print("API: Imports successful.") # ADD THIS LINE

# Load environment variables
load_dotenv()
print(f"API: SUPABASE_URL loaded: {os.environ.get('SUPABASE_URL') is not None}") # ADD THIS LINE
print(f"API: SUPABASE_KEY loaded: {os.environ.get('SUPABASE_KEY') is not None}") # ADD THIS LINE
print(f"API: SUPABASE_SERVICE_ROLE_KEY loaded: {os.environ.get('SUPABASE_SERVICE_ROLE_KEY') is not None}") # ADD THIS LINE
print(f"API: SUPABASE_JWT_SECRET loaded: {os.environ.get('SUPABASE_JWT_SECRET') is not None}") # ADD THIS LINE


# Supabase setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

if not all([SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET]):
    print("API: ERROR - Supabase environment variables not all set.") # ADD THIS LINE
    raise Exception("Supabase environment variables not set. Make sure SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET are all defined.")

print("API: Supabase environment variables checked.") # ADD THIS LINE

# Client for regular user operations (uses anon key)
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)
# Client for admin operations (uses service_role key)
supabase_admin_client = supabase.create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("API: Supabase clients created.") # ADD THIS LINE

app = FastAPI()

print("API: FastAPI app created.") # ADD THIS LINE

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("API: CORS middleware added.") # ADD THIS LINE

# --- Pydantic Models ---

class User(BaseModel):
    id: str
    role: Optional[str] = 'participant'
    full_name: Optional[str] = 'Test User'

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ExerciseResponse(BaseModel):
    response_data: Dict[str, Any]

class Assessment(BaseModel):
    id: int
    name: str
    questions: Any # Keep as Any to match DB JSON

class AssessmentSubmission(BaseModel):
    assessment_id: int
    answers: List[int]

class AssessmentResult(BaseModel):
    id: int
    assessment_id: int
    score: int
    created_at: datetime

class Progress(BaseModel):
    completion_percentage: float
    assessment_trends: Dict[str, List[AssessmentResult]]

class CaseloadParticipant(BaseModel):
    id: str
    full_name: str
    # last_activity: datetime # This requires more complex logic
    # risk_flags: List[str]

class Message(BaseModel):
    id: Optional[int] = None
    sender_id: str
    recipient_id: str
    content: str
    created_at: Optional[datetime] = None

class Asset(BaseModel):
    name: str
    url: str

class Exercise(BaseModel):
    id: int
    title: str
    type: str

class Lesson(BaseModel):
    id: int
    title: str
    exercises: List[Exercise]

class Module(BaseModel):
    id: int
    title: str
    lessons: List[Lesson]

class Program(BaseModel):
    modules: List[Module]

# --- Dependencies ---

async def get_current_user(request: Request) -> User:
    token = request.headers.get("Authorization")
    if not token:
        print("API: get_current_user - Authorization header missing.") # ADD THIS LINE
        raise HTTPException(status_code=401, detail="Authorization header missing")
    try:
        token = token.split(" ")[1]
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            print("API: get_current_user - Invalid token, user_id is None.") # ADD THIS LINE
            raise HTTPException(status_code=401, detail="Invalid token")

        # Fetch user profile from DB
        profile_res = supabase_client.table('profiles').select('*').eq('id', user_id).execute()
        if not profile_res.data:
            print(f"API: get_current_user - Profile not found for user_id: {user_id}") # ADD THIS LINE
            raise HTTPException(status_code=404, detail="Profile not found")

        profile = profile_res.data[0]
        print(f"API: get_current_user - User profile fetched for user_id: {user_id}") # ADD THIS LINE
        return User(id=user_id, role=profile.get('role'), full_name=profile.get('full_name'))
    except JWTError:
        print("API: get_current_user - JWTError: Invalid token.") # ADD THIS LINE
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"API: get_current_user - Unexpected error: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

# --- API Endpoints ---

@app.get("/")
def read_root():
    print("API: read_root endpoint hit.") # ADD THIS LINE
    return {"message": "Silvercloud clone API is running!"}

@app.post("/auth/signup")
async def signup(user_data: UserRegister):
    print(f"API: /auth/signup endpoint hit. Attempting to register user: {user_data.email}") # ADD THIS LINE
    try:
        # Create user in Supabase auth
        user_response = supabase_admin_client.auth.admin.create_user(
            {
                "email": user_data.email,
                "password": user_data.password,
                "email_confirm": True, # Auto-confirm email for simplicity, adjust as needed
            }
        )
        print(f"API: Supabase user created: {user_response.user.id}") # ADD THIS LINE

        # Insert into profiles table
        profile_data = {"id": user_response.user.id}
        if user_data.full_name:
            profile_data["full_name"] = user_data.full_name

        supabase_admin_client.table("profiles").insert(profile_data).execute()
        print("API: User profile inserted into DB.") # ADD THIS LINE

        print("API: User registered successfully.") # ADD THIS LINE
        return {"message": "User registered successfully", "user_id": user_response.user.id}
    except Exception as e:
        print(f"API: Error in /auth/signup: {e}") # ADD THIS LINE
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user_data: UserLogin):
    print(f"API: /auth/login endpoint hit. Attempting to log in user: {user_data.email}") # ADD THIS LINE
    try:
        response = supabase_client.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })
        print("API: User logged in successfully.") # ADD THIS LINE
        return {
            "message": "Login successful",
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": response.user.model_dump()
        }
    except Exception as e:
        print(f"API: Error in /auth/login: {e}") # ADD THIS LINE
        raise HTTPException(status_code=401, detail=str(e))

# --- Participant Endpoints ---

@app.get("/me", response_model=User)
def read_me(current_user: User = Depends(get_current_user)):
    print("API: /me endpoint hit.") # ADD THIS LINE
    return current_user

@app.get("/program", response_model=Program)
def get_program(current_user: User = Depends(get_current_user)):
    print("API: /program endpoint hit.") # ADD THIS LINE
    try:
        # This is a simplified query. A real app might use RPC functions for efficiency.
        modules_res = supabase_client.table('modules').select('*, lessons(*, exercises(*))').execute()
        print("API: Program data fetched.") # ADD THIS LINE
        return Program(modules=modules_res.data)
    except Exception as e:
        print(f"API: Error in /program: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/exercise/{exercise_id}/responses")
def save_exercise_response(exercise_id: int, response: ExerciseResponse, current_user: User = Depends(get_current_user)):
    print(f"API: /exercise/{exercise_id}/responses endpoint hit.") # ADD THIS LINE
    try:
        res = supabase_client.table('exercise_responses').insert({
            'user_id': current_user.id,
            'exercise_id': exercise_id,
            'response_data': response.response_data
        }).execute()
        print("API: Exercise response saved.") # ADD THIS LINE
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"API: Error in /exercise/{exercise_id}/responses: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/assessments", response_model=List[Assessment])
def get_assessments(current_user: User = Depends(get_current_user)):
    print("API: /assessments endpoint hit.") # ADD THIS LINE
    try:
        res = supabase_client.table('assessments').select('id, name, questions').execute()
        print("API: Assessments fetched.") # ADD THIS LINE
        return res.data
    except Exception as e:
        print(f"API: Error in /assessments: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assessments", response_model=AssessmentResult)
def submit_assessment(submission: AssessmentSubmission, current_user: User = Depends(get_current_user)):
    print("API: /assessments (POST) endpoint hit.") # ADD THIS LINE
    try:
        score = sum(submission.answers)
        res = supabase_client.table('assessment_submissions').insert({
            'user_id': current_user.id,
            'assessment_id': submission.assessment_id,
            'answers': submission.answers,
            'score': score
        }).execute()
        print("API: Assessment submitted.") # ADD THIS LINE
        return res.data[0]
    except Exception as e:
        print(f"API: Error in /assessments (POST): {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress", response_model=Progress)
def get_progress(current_user: User = Depends(get_current_user)):
    print("API: /progress endpoint hit.") # ADD THIS LINE
    # This is a simplified implementation
    try:
        exercises_res = supabase_client.table('exercises').select('id', count='exact').execute()
        total_exercises = exercises_res.count

        responses_res = supabase_client.table('exercise_responses').select('id', count='exact').eq('user_id', current_user.id).execute()
        completed_exercises = responses_res.count

        completion_percentage = (completed_exercises / total_exercises) * 100 if total_exercises > 0 else 0

        assessments_res = supabase_client.table('assessment_submissions').select('*, assessments(name)').eq('user_id', current_user.id).execute()

        trends = {}
        for sub in assessments_res.data:
            name = sub['assessments']['name']
            if name not in trends:
                trends[name] = []
            trends[name].append(AssessmentResult(**sub))

        print("API: Progress data calculated.") # ADD THIS LINE
        return Progress(completion_percentage=completion_percentage, assessment_trends=trends)
    except Exception as e:
        print(f"API: Error in /progress: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

# --- Supporter Endpoints ---

@app.get("/supporter/caseload", response_model=List[CaseloadParticipant])
def get_caseload(current_user: User = Depends(get_current_user)):
    print("API: /supporter/caseload endpoint hit.") # ADD THIS LINE
    # Add role check here in a real app
    # if current_user.role != 'supporter':
    #     raise HTTPException(status_code=403, detail="Not authorized")
    try:
        res = supabase_client.table('profiles').select('id, full_name').eq('role', 'participant').execute()
        print("API: Caseload fetched.") # ADD THIS LINE
        return res.data
    except Exception as e:
        print(f"API: Error in /supporter/caseload: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/supporter/users/{user_id}") # Timeline
def get_user_timeline(user_id: str, current_user: User = Depends(get_current_user)):
    print(f"API: /supporter/users/{user_id} endpoint hit.") # ADD THIS LINE
    try:
        responses = supabase_client.table('exercise_responses').select('*, exercises(title)').eq('user_id', user_id).execute().data
        assessments = supabase_client.table('assessment_submissions').select('*, assessments(name)').eq('user_id', user_id).execute().data
        timeline = sorted(responses + assessments, key=lambda x: x['created_at'], reverse=True)
        print("API: User timeline fetched.") # ADD THIS LINE
        return timeline
    except Exception as e:
        print(f"API: Error in /supporter/users/{user_id}: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/messages", response_model=Message)
def send_message(message: Message, current_user: User = Depends(get_current_user)):
    print("API: /messages (POST) endpoint hit.") # ADD THIS LINE
    try:
        # Ensure users can only send messages as themselves
        if message.sender_id != current_user.id:
            print("API: send_message - Cannot send message as another user.") # ADD THIS LINE
            raise HTTPException(status_code=403, detail="Cannot send message as another user")

        res = supabase_client.table('messages').insert(message.dict(exclude_unset=True)).execute()
        print("API: Message sent.") # ADD THIS LINE
        return res.data[0]
    except Exception as e:
        print(f"API: Error in /messages (POST): {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages/thread/{user_id}", response_model=List[Message])
def get_message_thread(user_id: str, current_user: User = Depends(get_current_user)):
    print(f"API: /messages/thread/{user_id} endpoint hit.") # ADD THIS LINE
    try:
        # Fetch messages between current user and the other user
        res = supabase_client.rpc('get_message_thread', {
            'user_a': current_user.id,
            'user_b': user_id
        }).execute()
        print("API: Message thread fetched.") # ADD THIS LINE
        return res.data
    except Exception as e:
        print(f"API: Error in /messages/thread/{user_id}: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

# --- Asset Endpoints ---

@app.get("/assets", response_model=List[Asset])
def get_assets(current_user: User = Depends(get_current_user)):
    print("API: /assets endpoint hit.") # ADD THIS LINE
    try:
        assets_res = supabase_client.table('assets').select('name, storage_path').execute()
        signed_urls = []
        for asset in assets_res.data:
            # Create signed URL, valid for 1 hour
            url_res = supabase_client.storage.from_('assets').create_signed_url(asset['storage_path'], 3600)
            signed_urls.append(Asset(name=asset['name'], url=url_res['signedURL']))
        print("API: Assets fetched and signed URLs created.") # ADD THIS LINE
        return signed_urls
    except Exception as e:
        print(f"API: Error in /assets: {e}") # ADD THIS LINE
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("API: Running Uvicorn locally.") # ADD THIS LINE
    uvicorn.run(app, host="0.0.0.0", port=8000)

print("API: Script finished initialization (outside __name__ == \"__main__\").") # ADD THIS LINE
