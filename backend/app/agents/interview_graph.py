from typing import TypedDict, Annotated, Sequence
import operator
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from app.core.config import settings
from app.schemas.interview import AnswerEvaluation, NextQuestion

class InterviewState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    candidate_profile_context: str
    current_question_index: int
    max_questions: int
    current_difficulty: int
    last_evaluation: AnswerEvaluation | None

from app.integrations.prism import prism_client, AIEvent

from langchain_core.messages import SystemMessage

def evaluate_answer_node(state: InterviewState):
    """Evaluates the candidate's last answer."""
    llm = ChatGroq(model=settings.LLM_MODEL, temperature=0, api_key=settings.LLM_API_KEY)
    structured_llm = llm.with_structured_output(AnswerEvaluation)
    
    messages = state['messages']
    question = messages[-2].content if len(messages) >= 2 else ""
    answer = messages[-1].content
    
    sys_msg = SystemMessage(content="You are an expert technical interviewer. Evaluate the candidate's answer. You MUST use the provided tool to output your response.")
    human_msg = HumanMessage(content=f"Question: {question}\nAnswer: {answer}\nProvide a structured evaluation.")
    
    evaluation = structured_llm.invoke([sys_msg, human_msg])
    
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
    
    if eval.overall >= 85:
        curr_diff = min(curr_diff + 1, 6)
    elif eval.overall < 50:
        curr_diff = max(curr_diff - 1, 1)
        
    return {"current_difficulty": curr_diff}

def question_generator_node(state: InterviewState):
    """Generates the next question."""
    llm = ChatGroq(model=settings.LLM_MODEL, temperature=0.7, api_key=settings.LLM_API_KEY)
    structured_llm = llm.with_structured_output(NextQuestion)
    
    sys_msg = SystemMessage(content="You are an expert technical interviewer. Generate the next interview question tailored to the candidate's actual projects or skills. You MUST use the provided tool to output your response.")
    human_msg = HumanMessage(content=f"Candidate Context: {state['candidate_profile_context']}\nCurrent Difficulty Level: {state['current_difficulty']}/6\nPrevious Feedback: {state['last_evaluation'].feedback if state.get('last_evaluation') else 'None'}\nGenerate the next question now.")
    
    # Simple retry loop for governance
    max_retries = settings.MAX_LLM_RETRIES
    next_q = None
    for attempt in range(max_retries):
        try:
            next_q = structured_llm.invoke([sys_msg, human_msg])
        except Exception as e:
            print(f"LLM Tool Error on attempt {attempt+1}: {e}")
            if attempt == max_retries - 1:
                # Fallback on absolute failure
                next_q = NextQuestion(question_text="Could you describe a challenging technical problem you solved recently?", rationale="Fallback due to LLM error")
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
             next_q = NextQuestion(question_text="Could you describe a challenging technical problem you solved recently?", rationale="Fallback due to Governance failure")
    
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
