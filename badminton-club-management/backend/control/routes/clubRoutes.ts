/*

// 📄 backend/control/routes/clubs.ts

import express, { Request, Response } from 'express';
import connectDB from '../../config/db';
import User from '../models/User';

const router = express.Router();

// 🧠 GET /api/clubs — Fetch unique club names from Club Admin & Independent Coach
router.get('/', async (req: Request, res: Response) => {
try {
const clubs = await User.aggregate([
{
$match: {
role: { $in: ['Club Admin', 'Independent Coach'] },
'club.name': { $exists: true, $ne: '' },    


}).select('club.name -_id');


const uniqueClubs = [...new Set(usersWithClubs.map(u => u.club?.name).filter(Boolean))];

res.status(200).json({ clubs: uniqueClubs });
} catch (error) {
console.error('❌ Error fetching clubs:', error);
res.status(500).json({ message: 'Failed to fetch clubs' });
}
});

export default router; */


/*

        },
    },
{
    $group: { _id: '$club.name',
    },
},
{
$project: {
_id: 0,
name: '$_id',
},
},
]);


const clubNames = clubs.map((club) => club.name);
res.json({ clubs: clubNames });
} catch (err) {
console.error('❌ Error fetching clubs:', err);
res.status(500).json({ message: 'Error fetching clubs' });
}
});

export default router;

*/


// 📁 backend/control/routes/clubRoutes.ts
import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
try {
// ✅ Find users with role 'Club Admin' or 'Independent Coach' and club.name present
const users = await User.find({
role: { $in: ['Club Admin', 'Independent Coach'] },
'club.name': { $exists: true, $ne: '' }
}).select('club.name'); // This works with find(), not aggregate()


// ✅ Extract and deduplicate club names
const uniqueClubs = Array.from(
  new Set(users.map((u: any) => u.club?.name).filter(Boolean))
);

return res.status(200).json({ clubs: uniqueClubs });
} catch (error) {
console.error('❌ Error fetching clubs:', error);
return res.status(500).json({ message: 'Failed to fetch clubs' });
}
});

export default router;