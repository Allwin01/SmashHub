import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player'; // adjust path if needed

dotenv.config();

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '', {});

    const players = await Player.find({ dob: { $exists: true } });

    for (const player of players) {
      const dob = new Date(player.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      const d = today.getDate() - dob.getDate();
      const isUnder18 = age < 18 || (age === 18 && (m < 0 || (m === 0 && d < 0)));

      player.isJunior = isUnder18;
      player.playerType = isUnder18 ? 'Junior Club Member' : 'Adult Club Member';

      await player.save();
      console.log(`✅ Updated ${player.firstName} ${player.surName} → ${player.playerType}`);
    }

    console.log('🎉 Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
