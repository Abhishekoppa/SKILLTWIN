from typing import TypedDict, Annotated, Sequence
import operator
import os
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from app.core.config import settings
from app.schemas.interview import AnswerEvaluation, NextQuestion
from app.integrations.prism import prism_client, AIEvent
from prismtrace import PRISMtraceLangGraphHandler, wrap_langgraph

class InterviewState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    candidate_profile_context: str
    current_question_index: int
    max_questions: int
    current_difficulty: int
    last_evaluation: AnswerEvaluation | None
    session_id: str
    candidate_name: str
    mode: str

import prismtrace
from prismtrace import PRISMtraceCallbackHandler
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

# Build the handler ONCE, at startup, as per the brief.
prism_handler = PRISMtraceCallbackHandler(
    api_key=os.environ.get("PRISMTRACE_API_KEY", "dummy_key"),
    project_id=os.environ.get("PRISMTRACE_PROJECT_ID", "dummy_project"),
    host=os.environ.get("PRISMTRACE_HOST", "https://prism-api-prod.up.railway.app")
)

def evaluate_answer_node(state: InterviewState):
    """Evaluates the candidate's last answer."""
    llm = ChatGroq(model=settings.LLM_MODEL, temperature=0, api_key=settings.LLM_API_KEY, callbacks=[prism_handler])
    structured_llm = llm.with_structured_output(AnswerEvaluation)
    
    messages = state['messages']
    question = messages[-2].content if len(messages) >= 2 else ""
    answer = messages[-1].content
    
    sys_msg = SystemMessage(content="You are an expert technical interviewer. Evaluate the candidate's answer carefully. Assess correctness, depth, reasoning, and communication. Be highly objective and constructive in your feedback.")
    human_msg = HumanMessage(content=f"Question: {question}\nAnswer: {answer}\nProvide a structured evaluation.")
    
    session_name = state.get("session_id", "skilltwin-interview-eval")
    meta = {"candidate_name": state.get("candidate_name", "Unknown"), "mode": state.get("mode", "Conceptual")}
    
    with prismtrace.session(session_name):
        evaluation = structured_llm.invoke([sys_msg, human_msg], config={"callbacks": [prism_handler], "metadata": meta})
        
    prism_handler.flush()
    
    # PRISM Governance for Evaluation
    event = AIEvent(
        event_type="answer_evaluation",
        input_context=f"Q: {question}\nA: {answer}",
        ai_output=evaluation.model_dump_json(),
        metadata={"difficulty": state['current_difficulty']}
    )
    gov_result = prism_client.evaluate_ai_event(event)
    prism_client.record_audit_event(event)
    
    if not gov_result.approved:
        print(f"Governance rejected evaluation: {gov_result.reason}")
        
    return {"last_evaluation": evaluation}

def difficulty_controller_node(state: InterviewState):
    """Adjusts difficulty based on evaluation and chooses next mode."""
    eval = state['last_evaluation']
    curr_diff = state['current_difficulty']
    
    if eval.overall >= 80:
        curr_diff = min(curr_diff + 1, 6)
    elif eval.overall < 60:
        curr_diff = max(curr_diff - 1, 1)
        
    return {"current_difficulty": curr_diff}

def question_generator_node(state: InterviewState):
    """Generates the next question."""
    llm = ChatGroq(model=settings.LLM_MODEL, temperature=0.7, api_key=settings.LLM_API_KEY, callbacks=[prism_handler])
    structured_llm = llm.with_structured_output(NextQuestion)
    
    sys_msg = SystemMessage(content="You are an expert technical interviewer. Generate the next interview question tailored to the candidate's actual projects or skills. The question MUST be short, crisp, and straight to the point (under 3 sentences). Do not use verbose pleasantries.")
    human_msg = HumanMessage(content=f"Candidate Context: {state['candidate_profile_context']}\nCurrent Difficulty Level: {state['current_difficulty']}/6\nPrevious Feedback: {state['last_evaluation'].feedback if state.get('last_evaluation') else 'None'}\nGenerate the next question now.")
    
    # Simple retry loop for governance
    max_retries = settings.MAX_LLM_RETRIES
    next_q = None
    
    session_name = state.get("session_id", "skilltwin-interview-gen")
    meta = {"candidate_name": state.get("candidate_name", "Unknown"), "mode": state.get("mode", "Conceptual")}

    for attempt in range(max_retries):
        try:
            with prismtrace.session(session_name):
                next_q = structured_llm.invoke([sys_msg, human_msg], config={"callbacks": [prism_handler], "metadata": meta})
            prism_handler.flush()
        except Exception as e:
            print(f"LLM Tool Error on attempt {attempt+1}: {e}")
            if attempt == max_retries - 1:
                # Fallback on absolute failure
                next_q = NextQuestion(
                    question_text="Could you describe a challenging technical problem you solved recently?", 
                    topic="General Experience",
                    difficulty_level=state['current_difficulty'],
                    mode="Conceptual",
                    is_coding_question=False,
                    time_limit_seconds=90
                )
            continue
            
        # PRISM Governance for Question Generation
        event = AIEvent(
            event_type="question_generation",
            input_context=state['candidate_profile_context'],
            ai_output=next_q.model_dump_json(),
            metadata={"difficulty": state['current_difficulty']}
        )
        gov_result = prism_client.evaluate_ai_event(event)
        prism_client.record_audit_event(event)
        
        if gov_result.approved:
            break
        print(f"Governance rejected question, regenerating (Attempt {attempt+1}): {gov_result.reason}")
        if attempt == max_retries - 1:
             next_q = NextQuestion(
                 question_text="Could you describe a challenging technical problem you solved recently?", 
                 topic="General Experience",
                 difficulty_level=state['current_difficulty'],
                 mode="Conceptual",
                 is_coding_question=False,
                 time_limit_seconds=90
             )
    
    return {
        "messages": [AIMessage(content=next_q.question_text)],
        "current_question_index": state["current_question_index"] + 1
    }

def should_continue(state: InterviewState):
    if state["current_question_index"] >= state["max_questions"]:
        return "end"
    return "continue"

workflow = StateGraph(InterviewState)

workflow.add_node("evaluate", evaluate_answer_node)
workflow.add_node("difficulty_control", difficulty_controller_node)
workflow.add_node("generate_question", question_generator_node)

workflow.set_entry_point("generate_question")

# When human answers, they call the graph and start from evaluate. 
# But in a typical API, we break the graph into steps.
# For simplicity, we'll expose functions instead of a running langgraph checkpointer for this hackathon
# Or use LangGraph but we invoke it per step.

# Just to build the graph:
workflow.add_edge("evaluate", "difficulty_control")
workflow.add_conditional_edges(
    "difficulty_control",
    should_continue,
    {
        "continue": "generate_question",
        "end": END
    }
)

interview_app = workflow.compile()
