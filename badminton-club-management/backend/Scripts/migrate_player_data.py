from pymongo import MongoClient
from bson import ObjectId

# Connect to local MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["badminton-club-management"]
players = db["players"]

# Fetch all players
all_players = players.find()

updated_count = 0

for player in all_players:
    updated = False

    # Convert skillMatrix Map-like data to plain object
    if isinstance(player.get("skillMatrix"), dict):
        new_skill_matrix = {}
        for group, skills in player["skillMatrix"].items():
            if isinstance(skills, dict):
                new_skill_matrix[group] = {k: v for k, v in skills.items()}
        player["skillMatrix"] = new_skill_matrix
        updated = True

    # Convert skillsHistory.skills if it contains any Map-like structures
    if "skillsHistory" in player:
        for history in player["skillsHistory"]:
            if isinstance(history.get("skills"), dict):
                new_skills = {}
                for group, skills in history["skills"].items():
                    if isinstance(skills, dict):
                        new_skills[group] = {k: v for k, v in skills.items()}
                history["skills"] = new_skills
                updated = True

    # Convert skillGroupAverages.groupAverages if needed
    if "skillGroupAverages" in player:
        for avg in player["skillGroupAverages"]:
            if isinstance(avg.get("groupAverages"), dict):
                avg["groupAverages"] = {k: float(v) for k, v in avg["groupAverages"].items()}
                updated = True

    # Save back if anything was changed
    if updated:
        players.update_one({"_id": player["_id"]}, {"$set": {
            "skillMatrix": player.get("skillMatrix"),
            "skillsHistory": player.get("skillsHistory"),
            "skillGroupAverages": player.get("skillGroupAverages")
        }})
        updated_count += 1

print(f"✅ Migration completed. Updated {updated_count} players.")
