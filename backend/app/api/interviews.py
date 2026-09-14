from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.interview import Interview, Question, Answer
from app.models.candidate import CandidateProfile
from app.api.auth import get_current_user
from app.agents.interview_graph import evaluate_answer_node, question_generator_node, difficulty_controller_node
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter()

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
    
    # Generate first question
    state = {
        "messages": [],
        "candidate_profile_context": f"Target Role: {profile.target_role}",
        "current_question_index": 0,
        "max_questions": 5,
        "current_difficulty": 1,
        "last_evaluation": None
    }
    
    new_state = question_generator_node(state)
    first_q_text = new_state["messages"][0].content
    
    question = Question(
        interview_id=interview.id,
        question_text=first_q_text,
        difficulty_level=1,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return {"interview_id": interview.id, "question": {"id": question.id, "text": question.question_text}}

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
        "max_questions": 5,
        "current_difficulty": question.difficulty_level,
        "last_evaluation": None
    }
    
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
    
    if len(interview.questions) >= 5:
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
    
    return {
        "feedback": evaluation.feedback,
        "next_question": {"id": new_question.id, "text": new_question.question_text}
    }
