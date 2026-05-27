"""
General Purpose Course / Learning Path Recommendation Engine
Uses Rule-Based scoring first, ML (KNN) as backup
"""

import numpy as np
from courses_data import COURSES

# ===== LABEL ENCODINGS =====
QUALIFICATIONS = [
    "No formal qualification needed", "School (up to 10th)", "High School (12th)",
    "ITI Certificate", "Diploma", "Graduate (Any Stream)", "Graduate (CS/IT)", "Post Graduate"
]

INTERESTS = [
    "Basic Computer Skills", "Digital Literacy", "Web Development",
    "Artificial Intelligence and Machine Learning",
    "Data Science and Analytics", "Cyber Security",
    "Cloud Computing", "Embedded Systems and IoT",
    "Database and SQL", "Chip Design and VLSI", "Python Programming",
    "Digital Marketing", "Graphic Design"
]

SKILLS = [
    "Complete Beginner (No prior knowledge)",
    "Basic (Some computer knowledge)",
    "Intermediate (Working knowledge)",
    "Advanced (Professional level)"
]

GOALS = [
    "Get a Job", "Upgrade Skills for Current Job",
    "Start a Business", "Higher Education", "Learn Something New"
]


def encode_profile(qualification, interest, skill, goal):
    """Convert user profile to numeric vector"""
    q = QUALIFICATIONS.index(qualification) if qualification in QUALIFICATIONS else 0
    i = INTERESTS.index(interest) if interest in INTERESTS else 0
    s = SKILLS.index(skill) if skill in SKILLS else 0
    g = GOALS.index(goal) if goal in GOALS else 0
    return [q, i, s, g]


# ===== RULE-BASED RECOMMENDER =====
def rule_based_recommend(qualification, interest, skill, goal, top_n=3):
    """
    Score each course based on how well it matches user profile.
    Each matching criterion adds points.
    """
    scored = []

    for course in COURSES:
        score = 0

        # Qualification match — +3 points
        if qualification in course["qualifications"]:
            score += 3

        # Interest match — +6 points (most important — must dominate)
        if interest in course["interests"]:
            score += 6

        # Skill match — +3 points
        if skill in course["skills"]:
            score += 3

        # Goal match — +2 points
        if goal in course["goals"]:
            score += 2

        # Bonus: free courses get +1 if goal is learn something new
        if course["fees"] == "FREE" and goal == "Learn Something New":
            score += 1

        # Bonus: beginner courses for beginners
        if course["level"] == "beginner" and skill == "Complete Beginner (No prior knowledge)":
            score += 1

        scored.append((score, course))

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    # Return top N with score > 0
    results = [(s, c) for s, c in scored if s > 0]
    return results[:top_n]


# ===== ML-BASED RECOMMENDER (KNN) =====
def build_ml_model():
    """Build KNN model from course data"""
    try:
        from sklearn.neighbors import KNeighborsClassifier
        from sklearn.preprocessing import StandardScaler

        X = []  # feature vectors
        y = []  # course ids

        for course in COURSES:
            for qual in course["qualifications"]:
                for interest in course["interests"]:
                    for skill in course["skills"]:
                        for goal in course["goals"]:
                            vector = encode_profile(qual, interest, skill, goal)
                            X.append(vector)
                            y.append(course["id"])

        X = np.array(X)
        y = np.array(y)

        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        k = min(5, len(set(y)))
        knn = KNeighborsClassifier(n_neighbors=k, metric='euclidean')
        knn.fit(X_scaled, y)

        return knn, scaler

    except Exception as e:
        print(f"ML model build failed: {e}")
        return None, None


# Build model once on import
print("Building ML recommendation model...")
KNN_MODEL, SCALER = build_ml_model()
if KNN_MODEL:
    print("ML model ready!")
else:
    print("Using rule-based only.")


def ml_recommend(qualification, interest, skill, goal, top_n=3):
    """Use KNN to find similar courses"""
    if KNN_MODEL is None or SCALER is None:
        return []

    try:
        vector = encode_profile(qualification, interest, skill, goal)
        vector_scaled = SCALER.transform([vector])

        distances, indices = KNN_MODEL.kneighbors(
            vector_scaled, n_neighbors=min(top_n * 2, len(COURSES))
        )

        seen_ids = set()
        results = []

        for dist, idx in zip(distances[0], indices[0]):
            pred_id = KNN_MODEL._y[idx]
            if pred_id not in seen_ids:
                seen_ids.add(pred_id)
                course = next((c for c in COURSES if c["id"] == pred_id), None)
                if course:
                    results.append((round(float(1 / (1 + dist)), 2), course))
            if len(results) >= top_n:
                break

        return results

    except Exception as e:
        print(f"ML recommend error: {e}")
        return []


# ===== MAIN RECOMMEND FUNCTION =====
def get_recommendations(qualification, interest, skill, goal):
    """
    Main function: Rule-based first, ML as backup/supplement
    Returns list of recommended courses with reasons
    """
    rule_results = rule_based_recommend(qualification, interest, skill, goal, top_n=3)

    if len(rule_results) >= 1:
        final_courses = [c for _, c in rule_results]
        method = "rule-based"
    else:
        ml_results = ml_recommend(qualification, interest, skill, goal, top_n=3)
        final_courses = [c for _, c in ml_results]
        method = "ml"

        rule_courses = [c for _, c in rule_results]
        for rc in rule_courses:
            if rc not in final_courses:
                final_courses.insert(0, rc)
        final_courses = final_courses[:3]

    return final_courses, method


def format_recommendations(courses, qualification, interest, skill, goal):
    """Format recommendations as readable text for chatbot"""
    if not courses:
        return "I could not find specific learning paths matching your profile. Please try adjusting your selections or ask me directly for suggestions."

    lines = []
    lines.append(f"Based on your profile (Qualification: {qualification}, Interest: {interest}, Skill: {skill}, Goal: {goal}), here are my top recommendations:\n")

    for i, course in enumerate(courses, 1):
        lines.append(f"{i}. **{course['name']}**")
        lines.append(f"   Duration: {course['duration']}")
        lines.append(f"   Fees: {course['fees']}")
        lines.append(f"   About: {course['description']}")
        lines.append(f"   Learn More: {course['apply_link']}")
        lines.append("")

    lines.append("Would you like more details about any of these? Feel free to ask!")
    return "\n".join(lines)
