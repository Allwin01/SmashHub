// 📌 User model with Mongoose + bcrypt  -  User setup in DB
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// ✅ TypeScript interface for User document
export interface IUser extends Document {
firstName: string;
surname: string;
email: string;
password: string;
role: string;
address: {
address1: string;
address2?: string;
postcode: string;
county: string;
country: string;
};
selectedClub?: string;
club?: {
name: string;
address: string;
city: string;
};
comparePassword(candidatePassword: string): Promise<boolean>;
}

// ✅ Define the User schema
const UserSchema: Schema<IUser> = new Schema<IUser>({
firstName: { type: String, required: true },
surname: { type: String, required: true },
email: { type: String, required: true, lowercase: true, trim: true },

password: { type: String, required: true },
role: { type: String, enum: ['Club Admin', 'Independent Coach', 'Parents', 'Super Admin','Tournament Organiser'], required: true },
address: {
address1: { type: String, required: true },
address2: { type: String },
postcode: { type: String, required: true },
county: { type: String, required: true },
country: { type: String, required: true },
},
selectedClub: { type: String }, 
// 👪 For Parents
club: {
name: String,
address: String,
city: String,
}, 
// 🏸 For Admin/Coach
}, {
timestamps: true,
});

// 🛡️ Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
if (!this.isModified('password')) return next();

try {
const saltRounds = 10;
this.password = await bcrypt.hash(this.password, saltRounds);
next();
} catch (err) {
next(err as any);
}
});

// 🔐 Compare password on login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
return bcrypt.compare(candidatePassword, this.password);
};

// 🧠 TODO: Add index for email/username for faster lookup in large datasets

// 🧱 Export compiled model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;