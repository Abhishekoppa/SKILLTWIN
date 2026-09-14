from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
from groq import Groq
from app.db.session import get_db
from app.models.user import User
from app.models.interview import Interview, Question, Answer
from app.models.candidate import CandidateProfile
from app.api.auth import get_current_user
from app.agents.interview_graph import evaluate_answer_node, question_generator_node, difficulty_controller_node
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter()

@router.post("/transcribe", response_model=dict)
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        audio_data = await file.read()
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        transcription = client.audio.transcriptions.create(
          file=(file.filename, audio_data),
          model="whisper-large-v3",
          response_format="json",
        )
        return {"transcript": transcription.text}
    except Exception as e:
        print("Transcription Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

def _get_question_metadata(difficulty_level: int):
    if difficulty_level <= 2:
        return {"is_coding_question": False, "time_limit_seconds": 90}
    elif difficulty_level <= 4:
        return {"is_coding_question": True, "time_limit_seconds": 300}
    else:
        return {"is_coding_question": True, "time_limit_seconds": 600}

class AnswerSubmission(BaseModel):
    question_id: int
    answer_text: str

@router.post("/", response_model=dict)
def start_interview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Create a profile first by uploading a resume")
        
    interview = Interview(user_id=current_user.id)
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    # Fetch GitHub repos if available
    github_context = ""
    if profile.github_url:
        import requests
        try:
            # Extract username from URL (e.g. https://github.com/username)
            username = profile.github_url.rstrip('/').split('/')[-1]
            if username:
                resp = requests.get(f"https://api.github.com/users/{username}/repos?sort=updated&per_page=5")
                if resp.status_code == 200:
                    repos = resp.json()
                    repo_names = [r.get('name') for r in repos if r.get('name')]
                    github_context = f"\nRecent GitHub Repos: {', '.join(repo_names)}"
        except Exception as e:
            print(f"Failed to fetch GitHub repos: {e}")

    state = {
        "messages": [],
        "candidate_profile_context": f"Target Role: {profile.target_role}{github_context}",
        "current_question_index": 0,
        "max_questions": 10,
        "current_difficulty": 1,
        "last_evaluation": None,
        "session_id": f"Interview-{interview.id}-{current_user.email}",
        "candidate_name": current_user.email,
        "mode": "Conceptual"
    }
    
    # Start with an intro question
    first_q_text = "Welcome! Let's start with a brief introduction. Could you tell me about yourself and walk me through your most recent projects?"
    
    question = Question(
        interview_id=interview.id,
        question_text=first_q_text,
        difficulty_level=1,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    
    meta = _get_question_metadata(question.difficulty_level)
    return {
        "interview_id": interview.id, 
        "question": {
            "id": question.id, 
            "text": question.question_text,
            "is_coding_question": meta["is_coding_question"],
            "time_limit_seconds": meta["time_limit_seconds"]
        }
    }

@router.post("/{interview_id}/answer", response_model=dict)
def submit_answer(
    interview_id: int,
    submission: AnswerSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id, Interview.user_id == current_user.id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    question = db.query(Question).filter(Question.id == submission.question_id).first()
    
    # Save Answer
    answer = Answer(
        question_id=question.id,
        answer_text=submission.answer_text
    )
    db.add(answer)
    db.commit()
    
    # Evaluate
    state = {
        "messages": [
            AIMessage(content=question.question_text),
            HumanMessage(content=submission.answer_text)
        ],
        "candidate_profile_context": "",
        "current_question_index": len(interview.questions),
        "max_questions": 10,
        "current_difficulty": question.difficulty_level,
        "last_evaluation": None,
        "session_id": f"Interview-{interview.id}-{current_user.email}",
        "candidate_name": current_user.email,
        "mode": "Coding" if _get_question_metadata(question.difficulty_level)["is_coding_question"] else "Conceptual"
    }
    
    if not submission.answer_text.strip():
        from app.schemas.interview import AnswerEvaluation
        evaluation = AnswerEvaluation(
            correctness=0,
            technical_depth=0,
            reasoning=0,
            communication=0,
            overall=0,
            feedback="You did not provide an answer. Let's move on to the next question."
        )
        state["last_evaluation"] = evaluation
    else:
        state.update(evaluate_answer_node(state))
        evaluation = state["last_evaluation"]
    
    # Update Answer with evaluation
    answer.correctness = evaluation.correctness
    answer.technical_depth = evaluation.technical_depth
    answer.reasoning = evaluation.reasoning
    answer.communication = evaluation.communication
    answer.overall = evaluation.overall
    answer.feedback = evaluation.feedback
    db.commit()
    
    if len(interview.questions) >= 10:
        interview.status = "completed"
        db.commit()
        return {"status": "completed", "feedback": evaluation.feedback}
        
    # Generate Next Question
    state.update(difficulty_controller_node(state))
    
    gen_state = question_generator_node(state)
    next_q_text = gen_state["messages"][0].content
    
    new_question = Question(
        interview_id=interview.id,
        question_text=next_q_text,
        difficulty_level=state["current_difficulty"]
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    meta = _get_question_metadata(state["current_difficulty"])
    return {
        "feedback": evaluation.feedback,
        "next_question": {
            "id": new_question.id, 
            "text": new_question.question_text,
            "is_coding_question": meta["is_coding_question"],
            "time_limit_seconds": meta["time_limit_seconds"]
        }
    }
