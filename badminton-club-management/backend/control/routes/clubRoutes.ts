

// 📁 backend/control/routes/clubRoutes.ts - This return the unique club name for  Parents role in Signup page
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