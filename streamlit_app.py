"""
Campus Placement Portal - Streamlit Web Application
Interactive Placement Analytics, Student Talent Directory, Job Openings & AI Chance Predictor.
Ready for 1-click deployment on Streamlit Community Cloud (https://share.streamlit.io).
"""

import os
import json
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import requests

# Set page configuration
st.set_page_config(
    page_title="Campus Placement Portal & Analytics",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -------------------------------------------------------------
# Data Retrieval & Database Helpers
# -------------------------------------------------------------
DEFAULT_MONGO_URI = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/placement_portal")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5001")

FALLBACK_STUDENTS = [
    {
        "name": "Aarav Sharma",
        "email": "aarav.sharma@placement.edu",
        "enrollment": "STU2024001",
        "department": "Computer Science and Engineering",
        "cgpa": 8.9,
        "placed": True,
        "company": "Google",
        "package_lpa": 22.0,
        "skills": ["Python", "JavaScript", "React", "Node.js", "MongoDB", "Data Structures"],
        "linkedin": "https://linkedin.com/in/aaravsharma",
        "github": "https://github.com/aaravsharma"
    },
    {
        "name": "Priya Patel",
        "email": "priya.patel@placement.edu",
        "enrollment": "STU2024002",
        "department": "Information Technology",
        "cgpa": 8.4,
        "placed": False,
        "company": "N/A",
        "package_lpa": 0.0,
        "skills": ["Java", "Spring Boot", "SQL", "Cloud Computing", "Docker"],
        "linkedin": "https://linkedin.com/in/priyapatel",
        "github": "https://github.com/priyapatel"
    },
    {
        "name": "Rohan Gupta",
        "email": "rohan.gupta@placement.edu",
        "enrollment": "STU2024003",
        "department": "Electronics and Communication",
        "cgpa": 7.8,
        "placed": True,
        "company": "InnovateTech",
        "package_lpa": 12.0,
        "skills": ["C++", "Embedded Systems", "IoT", "Python"],
        "linkedin": "https://linkedin.com/in/rohangupta",
        "github": "https://github.com/rohangupta"
    },
    {
        "name": "Ananya Desai",
        "email": "ananya.desai@placement.edu",
        "enrollment": "STU2024004",
        "department": "Computer Science and Engineering",
        "cgpa": 9.2,
        "placed": True,
        "company": "Microsoft",
        "package_lpa": 24.5,
        "skills": ["C#", ".NET Core", "Azure", "Machine Learning", "System Design"],
        "linkedin": "https://linkedin.com/in/ananyadesai",
        "github": "https://github.com/ananyadesai"
    },
    {
        "name": "Vikram Singh",
        "email": "vikram.singh@placement.edu",
        "enrollment": "STU2024005",
        "department": "Mechanical Engineering",
        "cgpa": 7.4,
        "placed": False,
        "company": "N/A",
        "package_lpa": 0.0,
        "skills": ["AutoCAD", "SolidWorks", "Python", "Data Analysis"],
        "linkedin": "https://linkedin.com/in/vikramsingh",
        "github": "https://github.com/vikramsingh"
    },
    {
        "name": "Neha Verma",
        "email": "neha.verma@placement.edu",
        "enrollment": "STU2024006",
        "department": "Information Technology",
        "cgpa": 8.1,
        "placed": True,
        "company": "Amazon",
        "package_lpa": 19.0,
        "skills": ["Java", "AWS", "DynamoDB", "Microservices"],
        "linkedin": "https://linkedin.com/in/nehaverma",
        "github": "https://github.com/nehaverma"
    }
]

FALLBACK_JOBS = [
    {
        "title": "Software Engineer - Full Stack",
        "company": "Google",
        "location": "Bengaluru / Hyderabad",
        "salary": "18 - 24 LPA",
        "min_cgpa": 8.0,
        "positions": 5,
        "skills": ["Data Structures", "Algorithms", "Java", "Python", "System Design"],
        "description": "Build scalable distributed cloud services used by millions of users worldwide."
    },
    {
        "title": "Cloud Solutions Associate",
        "company": "Microsoft",
        "location": "Bengaluru / Noida",
        "salary": "16 - 20 LPA",
        "min_cgpa": 7.5,
        "positions": 8,
        "skills": ["Azure", "Cloud Architecture", "C# / Python", "Networking"],
        "description": "Design enterprise-grade Azure architectures and cloud migrations."
    },
    {
        "title": "Frontend Developer",
        "company": "InnovateTech Labs",
        "location": "Pune / Remote",
        "salary": "10 - 14 LPA",
        "min_cgpa": 7.0,
        "positions": 4,
        "skills": ["React", "TypeScript", "HTML5", "CSS3", "REST APIs"],
        "description": "Craft intuitive and high performance web experiences for global client portals."
    },
    {
        "title": "Software Development Engineer (SDE-1)",
        "company": "Amazon",
        "location": "Hyderabad",
        "salary": "20 - 28 LPA",
        "min_cgpa": 8.2,
        "positions": 10,
        "skills": ["Java", "AWS", "Distributed Systems", "Algorithms"],
        "description": "Innovate and build high-throughput e-commerce and logistics platforms."
    }
]

@st.cache_data(ttl=60)
def fetch_portal_data():
    """Attempt to load from MongoDB, falling back gracefully to embedded dataset."""
    students = []
    jobs = []
    source = "Demo / Cached"

    try:
        import pymongo
        client = pymongo.MongoClient(DEFAULT_MONGO_URI, serverSelectionTimeoutMS=1500)
        db = client.get_default_database() or client["placement_portal"]
        user_col = db["users"]
        job_col = db["jobs"]
        
        db_users = list(user_col.find({"role": "student"}))
        db_jobs = list(job_col.find({}))
        
        if db_users:
            source = "Live MongoDB"
            for u in db_users:
                profile = u.get("profile", {})
                binfo = profile.get("basicInfo", {})
                cinfo = profile.get("contactInfo", {})
                acad = profile.get("academic", {})
                skills = acad.get("skills", {}).get("technical", []) if isinstance(acad.get("skills"), dict) else []

                cgpa_val = 7.5
                try:
                    if binfo.get("cgpa"):
                        cgpa_val = float(binfo.get("cgpa"))
                except:
                    pass

                students.append({
                    "name": u.get("name", "Student"),
                    "email": u.get("email", ""),
                    "enrollment": u.get("enrollmentNumber", "N/A"),
                    "department": binfo.get("department", "Engineering"),
                    "cgpa": cgpa_val,
                    "placed": bool(u.get("placed", False)),
                    "company": "Placed Company" if u.get("placed") else "N/A",
                    "package_lpa": 12.0 if u.get("placed") else 0.0,
                    "skills": skills or ["Python", "Web Development"],
                    "linkedin": cinfo.get("linkedin", "#"),
                    "github": cinfo.get("github", "#")
                })
                
        if db_jobs:
            for j in db_jobs:
                jobs.append({
                    "title": j.get("title", "Position"),
                    "company": j.get("company", "Company"),
                    "location": j.get("location", "Hybrid"),
                    "salary": j.get("salary", "Competitive"),
                    "min_cgpa": 7.0,
                    "positions": j.get("positions", 1),
                    "skills": j.get("skills", []),
                    "description": j.get("description", "Exciting campus role.")
                })
    except Exception as e:
        # Graceful fallback on network timeout or cloud run
        pass

    if not students:
        students = FALLBACK_STUDENTS
    if not jobs:
        jobs = FALLBACK_JOBS

    return pd.DataFrame(students), pd.DataFrame(jobs), source

students_df, jobs_df, data_source = fetch_portal_data()

# -------------------------------------------------------------
# Sidebar Navigation
# -------------------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/graduation-cap.png", width=70)
    st.title("Campus Placement Portal")
    st.caption("AI-Powered Placement & Talent Suite")
    st.markdown("---")

    menu = st.radio(
        "Navigation Menu",
        [
            "📊 Placement Analytics",
            "🤖 AI Chance Predictor",
            "🎓 Student Directory",
            "💼 Job Openings & Drives",
            "📝 Aptitude & Mock Test",
            "⚙️ System & Deployment"
        ],
        index=0
    )

    st.markdown("---")
    st.markdown(f"**Data Source:** `{data_source}`")
    
    # Check backend status
    backend_status = "Offline"
    try:
        res = requests.get(f"{BACKEND_URL}/api/health", timeout=0.8)
        if res.status_code in [200, 503]:
            backend_status = "Online (5001)"
    except:
        backend_status = "Not running locally"
        
    st.markdown(f"**Backend Server:** `{backend_status}`")
    st.caption("GitHub: [abhayraj04/Campus_Placement_Portal](https://github.com/abhayraj04/Campus_Placement_Portal)")


# -------------------------------------------------------------
# 1. Placement Analytics Dashboard
# -------------------------------------------------------------
if menu == "📊 Placement Analytics":
    st.title("📊 Campus Placement Overview & Analytics")
    st.markdown("Real-time metrics on candidate recruitment, department rates, and hiring packages.")

    # KPI Top Cards
    total_students = len(students_df)
    placed_students = len(students_df[students_df["placed"] == True])
    placement_rate = (placed_students / total_students * 100) if total_students else 0
    placed_only = students_df[students_df["placed"] == True]
    avg_package = placed_only["package_lpa"].mean() if not placed_only.empty else 0
    highest_package = placed_only["package_lpa"].max() if not placed_only.empty else 0

    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("Total Students", f"{total_students}")
    col2.metric("Placed Students", f"{placed_students}")
    col3.metric("Placement Rate", f"{placement_rate:.1f}%")
    col4.metric("Avg Package", f"₹ {avg_package:.1f} LPA")
    col5.metric("Highest Package", f"₹ {highest_package:.1f} LPA")

    st.markdown("---")

    # Analytics Charts
    c1, c2 = st.columns([1, 1])

    with c1:
        st.subheader("Placement Distribution")
        fig_donut = px.pie(
            values=[placed_students, total_students - placed_students],
            names=["Placed", "Seeking Placement"],
            color=["Placed", "Seeking Placement"],
            color_discrete_map={"Placed": "#10b981", "Seeking Placement": "#6366f1"},
            hole=0.45
        )
        fig_donut.update_layout(margin=dict(t=20, b=20, l=20, r=20))
        st.plotly_chart(fig_donut, use_container_width=True)

    with c2:
        st.subheader("Department Placement Performance")
        dept_summary = students_df.groupby("department")["placed"].agg(["count", "sum"]).reset_index()
        dept_summary.columns = ["Department", "Total", "Placed"]
        dept_summary["Rate %"] = (dept_summary["Placed"] / dept_summary["Total"] * 100).round(1)

        fig_bar = px.bar(
            dept_summary,
            x="Department",
            y="Rate %",
            color="Rate %",
            color_continuous_scale="Viridis",
            text="Rate %"
        )
        fig_bar.update_layout(yaxis_range=[0, 100], margin=dict(t=20, b=20, l=20, r=20))
        st.plotly_chart(fig_bar, use_container_width=True)

    c3, c4 = st.columns([1, 1])

    with c3:
        st.subheader("Package (CTC) Distribution (LPA)")
        if not placed_only.empty:
            fig_hist = px.histogram(
                placed_only,
                x="package_lpa",
                nbins=6,
                color_discrete_sequence=["#8b5cf6"],
                labels={"package_lpa": "Package (LPA)"}
            )
            fig_hist.update_layout(margin=dict(t=20, b=20, l=20, r=20))
            st.plotly_chart(fig_hist, use_container_width=True)
        else:
            st.info("No package data recorded yet.")

    with c4:
        st.subheader("Top In-Demand Skills")
        all_skills = []
        for s_list in students_df["skills"]:
            if isinstance(s_list, list):
                all_skills.extend(s_list)
        
        if all_skills:
            skill_counts = pd.Series(all_skills).value_counts().head(8).reset_index()
            skill_counts.columns = ["Skill", "Count"]
            fig_skill = px.bar(
                skill_counts,
                x="Count",
                y="Skill",
                orientation="h",
                color="Count",
                color_continuous_scale="Purples"
            )
            fig_skill.update_layout(yaxis=dict(autorange="reversed"), margin=dict(t=20, b=20, l=20, r=20))
            st.plotly_chart(fig_skill, use_container_width=True)


# -------------------------------------------------------------
# 2. AI Placement Chance Predictor
# -------------------------------------------------------------
elif menu == "🤖 AI Chance Predictor":
    st.title("🤖 AI Placement Chance & Salary Predictor")
    st.markdown("Input academic and technical attributes to assess placement readiness and projected salary band.")

    with st.form("predictor_form"):
        col1, col2 = st.columns(2)
        with col1:
            cgpa = st.slider("Cumulative GPA (CGPA)", min_value=5.0, max_value=10.0, value=8.2, step=0.1)
            backlogs = st.number_input("Active Backlogs", min_value=0, max_value=10, value=0)
            branch = st.selectbox("Engineering Department", [
                "Computer Science and Engineering",
                "Information Technology",
                "Electronics and Communication",
                "Electrical Engineering",
                "Mechanical Engineering",
                "Civil Engineering"
            ])
            internships = st.slider("Internships Completed", min_value=0, max_value=5, value=1)

        with col2:
            projects = st.slider("Significant Projects (Full-stack / ML / IoT)", min_value=0, max_value=10, value=3)
            coding_rating = st.slider("DSA / Coding Proficiency (1 to 10)", min_value=1, max_value=10, value=7)
            comm_rating = st.slider("Communication / Soft Skills (1 to 10)", min_value=1, max_value=10, value=8)
            certifications = st.slider("Industry Certifications (AWS / Azure / GCP / etc.)", min_value=0, max_value=6, value=2)

        submit = st.form_submit_button("🚀 Calculate Placement Probability", use_container_width=True)

    if submit:
        # Algorithmic predictive scoring
        base_score = (cgpa / 10.0) * 35.0
        backlog_penalty = backlogs * 15.0
        internship_bonus = min(internships * 8.0, 16.0)
        project_bonus = min(projects * 4.0, 16.0)
        dsa_score = (coding_rating / 10.0) * 20.0
        soft_skills = (comm_rating / 10.0) * 10.0
        cert_bonus = min(certifications * 2.5, 5.0)

        raw_chance = base_score + internship_bonus + project_bonus + dsa_score + soft_skills + cert_bonus - backlog_penalty
        chance = max(5.0, min(99.0, raw_chance))

        # Expected CTC estimate
        if chance >= 85 and cgpa >= 8.5 and coding_rating >= 8:
            tier = "🌟 Super Dream Tier"
            ctc_range = "18 - 32 LPA"
            badge_color = "#10b981"
        elif chance >= 70:
            tier = "🚀 Dream Tier"
            ctc_range = "10 - 18 LPA"
            badge_color = "#3b82f6"
        elif chance >= 50:
            tier = "💼 Standard Placement Tier"
            ctc_range = "5 - 9 LPA"
            badge_color = "#f59e0b"
        else:
            tier = "⚠️ High Risk - Needs Skill Uplift"
            ctc_range = "3.5 - 5 LPA"
            badge_color = "#ef4444"

        st.markdown("---")
        st.subheader("🎯 Assessment Results")

        res_col1, res_col2, res_col3 = st.columns(3)
        res_col1.metric("Placement Probability", f"{chance:.1f}%")
        res_col2.metric("Projected Placement Tier", tier)
        res_col3.metric("Estimated Package Band", ctc_range)

        # Progress bar
        st.progress(chance / 100.0)

        # Breakdown radar / gauge
        st.markdown("#### 🔍 Competency Breakdown")
        comp_df = pd.DataFrame({
            "Competency": ["Academics (CGPA)", "Coding & DSA", "Projects", "Internships", "Communication"],
            "Score %": [
                (cgpa / 10.0) * 100,
                (coding_rating / 10.0) * 100,
                min((projects / 4.0) * 100, 100),
                min((internships / 2.0) * 100, 100),
                (comm_rating / 10.0) * 100
            ]
        })

        fig_comp = px.bar(
            comp_df,
            x="Competency",
            y="Score %",
            color="Score %",
            color_continuous_scale="Blues",
            range_y=[0, 100],
            text="Score %"
        )
        st.plotly_chart(fig_comp, use_container_width=True)

        # Tailored Advice
        st.markdown("#### 💡 Tailored Action Plan")
        if backlogs > 0:
            st.warning("⚠️ **Clear Backlogs:** Top product companies (Google, Microsoft, Amazon) mandate zero active backlogs at time of interview.")
        if coding_rating < 7:
            st.info("💡 **DSA Enhancement:** Practice at least 2 LeetCode/HackerRank problems daily focusing on Trees, Dynamic Programming, and Graph algorithms.")
        if internships == 0:
            st.info("💼 **Practical Exposure:** Target summer or winter internships or build open-source full-stack projects to strengthen hands-on experience.")
        if chance >= 85:
            st.success("🎉 **Exceptional Profile:** You are on track for top-tier Super Dream placement offers! Practice mock interviews and system design.")


# -------------------------------------------------------------
# 3. Student Talent Directory
# -------------------------------------------------------------
elif menu == "🎓 Student Directory":
    st.title("🎓 Student Talent Pool")
    st.markdown("Explore verified candidate profiles, technical competencies, and academic records.")

    # Filter row
    f1, f2, f3 = st.columns(3)
    with f1:
        selected_dept = st.selectbox("Filter by Department", ["All"] + sorted(list(students_df["department"].unique())))
    with f2:
        status_filter = st.selectbox("Placement Status", ["All", "Placed", "Seeking Placement"])
    with f3:
        min_cgpa_filter = st.slider("Minimum CGPA", 6.0, 10.0, 6.0, 0.1)

    filtered = students_df.copy()
    if selected_dept != "All":
        filtered = filtered[filtered["department"] == selected_dept]
    if status_filter == "Placed":
        filtered = filtered[filtered["placed"] == True]
    elif status_filter == "Seeking Placement":
        filtered = filtered[filtered["placed"] == False]
    filtered = filtered[filtered["cgpa"] >= min_cgpa_filter]

    st.markdown(f"**Found {len(filtered)} candidate(s)**")

    for _, row in filtered.iterrows():
        with st.container():
            st.markdown(f"""
            <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 18px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #fff;">{row['name']} <span style="font-size: 14px; color: #94a3b8;">({row['enrollment']})</span></h3>
                    <span style="background: {'#10b981' if row['placed'] else '#6366f1'}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">
                        {'Placed: ' + str(row['company']) if row['placed'] else 'Seeking Placement'}
                    </span>
                </div>
                <p style="margin: 6px 0; color: #cbd5e1;">🎓 <strong>{row['department']}</strong> | CGPA: <strong>{row['cgpa']}</strong></p>
                <div style="margin: 8px 0;">
                    {' '.join([f'<span style="background: #334155; color: #e2e8f0; padding: 2px 8px; border-radius: 6px; font-size: 11px; margin-right: 4px;">{s}</span>' for s in (row['skills'] if isinstance(row['skills'], list) else [])])}
                </div>
                <div style="margin-top: 10px; font-size: 13px;">
                    <a href="{row['linkedin']}" target="_blank" style="color: #38bdf8; text-decoration: none; margin-right: 15px;">🔗 LinkedIn</a>
                    <a href="{row['github']}" target="_blank" style="color: #a855f7; text-decoration: none;">💻 GitHub</a>
                </div>
            </div>
            """, unsafe_allow_html=True)


# -------------------------------------------------------------
# 4. Job Openings & Campus Drives
# -------------------------------------------------------------
elif menu == "💼 Job Openings & Drives":
    st.title("💼 Active Campus Drives & Job Openings")
    st.markdown("Explore verified company postings, minimum eligibility criteria, and CTC packages.")

    cgpa_input = st.number_input("Enter your CGPA to check eligibility across all drives:", 5.0, 10.0, 8.0, 0.1)

    for idx, job in jobs_df.iterrows():
        min_c = float(job.get("min_cgpa", 7.0))
        is_eligible = cgpa_input >= min_c

        with st.expander(f"{job['company']} - {job['title']} ({job['salary']})", expanded=True):
            col_a, col_b = st.columns([3, 1])
            with col_a:
                st.markdown(f"**Location:** {job['location']} | **Openings:** {job['positions']}")
                st.markdown(f"**Description:** {job['description']}")
                st.markdown(f"**Minimum CGPA Required:** `{min_c}`")
                
                skills_raw = job.get("skills", [])
                if skills_raw and isinstance(skills_raw, list):
                    st.markdown("**Required Skills:** " + " • ".join([f"`{s}`" for s in skills_raw]))
            
            with col_b:
                if is_eligible:
                    st.success("✅ Eligible to Apply")
                    if st.button(f"Apply Now", key=f"apply_{idx}"):
                        st.toast(f"Application submitted to {job['company']} for {job['title']}!", icon="🎉")
                else:
                    st.error(f"❌ Ineligible (Min CGPA {min_c})")


# -------------------------------------------------------------
# 5. Aptitude & Mock Test Arena
# -------------------------------------------------------------
elif menu == "📝 Aptitude & Mock Test":
    st.title("📝 Placement Aptitude & Technical Arena")
    st.markdown("Practice high-frequency interview questions with instant scoring.")

    questions = [
        {
            "id": 1,
            "category": "Quantitative Aptitude",
            "q": "Which is the next number in the series: 2, 6, 12, 20, 30, ?",
            "options": ["36", "40", "42", "48"],
            "ans": "42",
            "explanation": "Pattern: 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=42."
        },
        {
            "id": 2,
            "category": "Quantitative Aptitude",
            "q": "A train travels 120 km in 1.5 hours. What is its average speed?",
            "options": ["60 km/h", "70 km/h", "80 km/h", "90 km/h"],
            "ans": "80 km/h",
            "explanation": "Speed = Distance / Time = 120 / 1.5 = 80 km/h."
        },
        {
            "id": 3,
            "category": "Technical (CS & DSA)",
            "q": "What is the worst-case time complexity of searching in a Balanced Binary Search Tree (AVL / Red-Black)?",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            "ans": "O(log n)",
            "explanation": "Balanced BST maintains height of O(log n), ensuring O(log n) lookups."
        },
        {
            "id": 4,
            "category": "Technical (Web Development)",
            "q": "What is the output of `typeof null` in JavaScript?",
            "options": ["null", "undefined", "object", "boolean"],
            "ans": "object",
            "explanation": "In JavaScript, `typeof null` is a well-known legacy behavior returning 'object'."
        },
        {
            "id": 5,
            "category": "HR & Behavioral",
            "q": "What is the most effective way to address a technical question during an interview when you don't know the exact answer?",
            "options": [
                "Guess randomly without telling the interviewer",
                "Admit you don't know the exact syntax, but explain your logical problem-solving approach",
                "Stay silent and wait for the next question",
                "Blame the college syllabus"
            ],
            "ans": "Admit you don't know the exact syntax, but explain your logical problem-solving approach",
            "explanation": "Interviewers value intellectual honesty, problem breakdown, and analytical reasoning."
        }
    ]

    score = 0
    with st.form("mock_test_form"):
        user_answers = {}
        for q in questions:
            st.markdown(f"**[{q['category']}] Q{q['id']}: {q['q']}**")
            user_answers[q['id']] = st.radio(f"Select option for Q{q['id']}:", q["options"], key=f"q_{q['id']}")
            st.markdown("---")

        submitted = st.form_submit_button("Submit Test & View Score", use_container_width=True)

    if submitted:
        for q in questions:
            if user_answers.get(q['id']) == q['ans']:
                score += 1

        pct = (score / len(questions)) * 100
        st.subheader(f"Test Result: {score}/{len(questions)} ({pct:.0f}%)")
        if pct >= 80:
            st.success("🏆 Excellent performance! Ready for top placement aptitude rounds.")
        elif pct >= 60:
            st.info("👍 Good effort! Review your incorrect answers below.")
        else:
            st.warning("⚠️ Keep practicing! Review the solution explanations below.")

        st.markdown("### Answer Review & Explanations")
        for q in questions:
            user_ans = user_answers.get(q['id'])
            correct = user_ans == q['ans']
            status_icon = "✅" if correct else "❌"
            with st.expander(f"{status_icon} Q{q['id']}: Your answer: {user_ans} | Correct: {q['ans']}"):
                st.markdown(f"**Explanation:** {q['explanation']}")


# -------------------------------------------------------------
# 6. System & Deployment Info
# -------------------------------------------------------------
elif menu == "⚙️ System & Deployment":
    st.title("⚙️ System Status, Architecture & Deployment")
    st.markdown("Guide to running locally and deploying on **Streamlit Community Cloud**, **Vercel**, and **Render**.")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("🖥️ Local Services Status")
        st.write(f"- **MongoDB Connection:** `{data_source}`")
        st.write(f"- **Streamlit Port:** `8501`")
        st.write(f"- **Backend API URL:** `{BACKEND_URL}`")
        st.write(f"- **Backend Status:** `{backend_status}`")

        if st.button("🔄 Reseed MongoDB Data"):
            try:
                import subprocess
                res = subprocess.run(["node", "server/seedData.js"], capture_output=True, text=True)
                st.success("Successfully seeded database!")
                st.code(res.stdout)
                st.cache_data.clear()
            except Exception as ex:
                st.error(f"Error running seed: {ex}")

    with col2:
        st.subheader("🚀 1-Click Streamlit Cloud Deployment")
        st.markdown("""
        To deploy this Streamlit app online for free:
        1. Push this repository to GitHub: `git push origin main`
        2. Visit **[share.streamlit.io](https://share.streamlit.io)**
        3. Click **New app** and select:
           - **Repository:** `abhayraj04/Campus_Placement_Portal`
           - **Branch:** `main`
           - **Main file path:** `streamlit_app.py`
        4. Click **Deploy!**
        Your live interactive Streamlit application will be online worldwide in seconds!
        """)

    st.markdown("---")
    st.subheader("🌐 Full Stack Architecture")
    st.markdown("""
    | Layer | Technology | Deployment Platform |
    |---|---|---|
    | **Streamlit Analytics App** | Python 3 + Streamlit + Plotly | **Streamlit Community Cloud** (`share.streamlit.io`) |
    | **Full Stack Client** | React 19 + Vite | **Vercel** (`client/dist`) |
    | **API Server** | Node.js + Express | **Render** or **Railway** |
    | **Database** | MongoDB Atlas / Local MongoDB | **MongoDB Atlas** |
    """)

