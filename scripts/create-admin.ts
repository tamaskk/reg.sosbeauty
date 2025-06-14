import { connectDB } from '../lib/mongodb/mongodb';
import { User } from '../lib/mongodb/models/User';
import { hash } from 'bcryptjs';

async function createAdmin() {
  try {
    await connectDB();

    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4];

    if (!email || !password || !name) {
      console.error('Please provide email, password, and name as arguments');
      process.exit(1);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.error('User with this email already exists');
      process.exit(1);
    }

    const hashedPassword = await hash(password, 12);

    const admin = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'admin',
    });

    console.log('Admin user created successfully:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 