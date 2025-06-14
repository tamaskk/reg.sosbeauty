# SOS Beauty

A platform connecting beauty service providers with clients in Hungary. The application allows beauty professionals to showcase their services, manage their profiles, and connect with potential clients.

## Features

- Provider registration and profile management
- Social media integration (Instagram, Facebook, TikTok)
- Service categorization and search
- Admin dashboard for provider management
- Responsive design for all devices

## Tech Stack

- Next.js
- TypeScript
- MongoDB
- Tailwind CSS
- React Hook Form
- Yup validation

## Getting Started

1. Clone the repository:
```bash
git clone [your-repo-url]
cd sosbeauty
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## License

[Your chosen license]
