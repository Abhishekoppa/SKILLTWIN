# SkillTwin 🚀

**SkillTwin** is an intelligent, dynamic AI platform designed to transform how developers and recruiters validate skills. By combining resume parsing, real-world code evidence from GitHub, and an adaptive AI-driven live interview, SkillTwin builds a verified, evidence-backed "Skill Profile" (your twin) that proves what you can actually do, rather than just what you claim.

![Dashboard Preview](frontend/src/assets/hero.png) <!-- Update this path if a different screenshot is preferred -->

## ✨ Key Features

1. **Intelligent Resume Parsing (The Claim)**
   - Upload your resume (PDF).
   - Our Groq-powered LLM instantly extracts your core skills, experiences, and calculates an ATS Match Score based on your target job title.
   - SkillTwin creates a baseline profile of your "Claimed Confidence" for each skill.

2. **Code Evidence Engine (The Proof)**
   - Connect your GitHub account (by username or URL).
   - SkillTwin analyzes your public repositories, languages used, and commit history.
   - It cross-references your code with your resume claims to generate an "Evidence Confidence" score.

3. **Adaptive Live AI Interview (The Test)**
   - An immersive, full-screen, voice-enabled interview experience.
   - The AI dynamically generates technical questions tailored specifically to the gaps between your resume claims and your GitHub evidence.
   - Features a **60-second visual countdown timer** for each question and live speech-to-text transcription.
   - Powered by LangGraph to seamlessly evaluate your answer, adjust the difficulty of the next question, and generate the next prompt in real-time.

4. **Comprehensive "SkillTwin" Profile**
   - After the interview, view your finalized profile.
   - Beautiful data visualizations show your Claimed Score vs. Evidence Score vs. Demonstrated (Interview) Score.
   - Provides actionable feedback on where you excel and where you need improvement.

5. **Built-in AI Governance (PRISM)**
   - Integrates with Block Convey's PRISM for AI Governance.
   - Every AI evaluation and generated question is audited and screened for compliance and safety.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** + **Shadcn UI** for modern, responsive components
- **React Query** for server state management
- **Lucide React** for beautiful iconography
- **Web Speech API** for voice synthesis and live transcription

### Backend
- **FastAPI** (Python 3.10+)
- **SQLAlchemy** + **Alembic** (ORM and Migrations)
- **PostgreSQL** (Hosted on Neon)
- **LangChain** & **LangGraph** (Stateful AI Agent Workflow)
- **Groq API** (Lightning-fast LLM inference using Llama 3)
- **PyMuPDF** for rapid resume text extraction

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- A PostgreSQL Database (Neon recommended)
- A Groq API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file (copy `.env.example` to `.env` and add your database URL and Groq API key).
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture

SkillTwin uses a highly modular state-graph approach for its AI Interview Engine:
- **Question Generator Node**: Uses context (resume + github evidence) and current difficulty to generate a tailored technical question.
- **Answer Evaluator Node**: Grades the candidate's transcribed audio answer on Technical Depth, Reasoning, and Communication.
- **Difficulty Controller Node**: Adjusts the complexity of the next question based on the previous evaluation score (Adaptive Testing).

---

## 📜 License
This project was built for a Hackathon and is open-sourced under the MIT License.
