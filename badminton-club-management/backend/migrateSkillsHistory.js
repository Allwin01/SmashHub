// migrateSkillsHistory.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Change if needed
const dbName = 'badmintonDB';
const collectionName = 'players';

async function runMigration() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const players = db.collection(collectionName);

    const allPlayers = await players.find().toArray();

    let updatedCount = 0;

    for (const player of allPlayers) {
      const history = player.skillsHistory || [];
      let modified = false;

      const migratedHistory = history.map(entry => {
        const fixedSkills = {};
        for (const group in entry.skills || {}) {
          const skillsMap = entry.skills[group];

          if (
            skillsMap instanceof Map ||
            typeof skillsMap?.get === 'function' || // detect leftover Maps
            Object.values(skillsMap).some(val => typeof val !== 'number')
          ) {
            // Convert to plain object
            fixedSkills[group] = Object.fromEntries(
              Object.entries(skillsMap).map(([k, v]) => [k, v])
            );
            modified = true;
          } else {
            fixedSkills[group] = skillsMap; // Already plain
          }
        }

        return { ...entry, skills: fixedSkills };
      });

      if (modified) {
        await players.updateOne(
          { _id: player._id },
          { $set: { skillsHistory: migratedHistory } }
        );
        updatedCount++;
        console.log(`🔁 Migrated: ${player.firstName} ${player.surName || ''}`);
      }
    }

    console.log(`🎉 Migration complete. Players updated: ${updatedCount}`);
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.close();
  }
}

runMigration();
