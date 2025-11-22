# 🎓 Iqdaam Attendance Tracker

A modern, full-featured student attendance tracking system built with Next.js, TypeScript, and PostgreSQL. Perfect for schools and educational institutions to manage student attendance efficiently with advanced analytics and real-time monitoring.

## 🛠️ Tech Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-000000?style=for-the-badge&logo=drizzle&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix%20UI-000000?style=for-the-badge&logo=radix-ui&logoColor=white)
![React Query](https://img.shields.io/badge/React%20Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![UploadThing](https://img.shields.io/badge/UploadThing-000000?style=for-the-badge&logo=uploadthing&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-000000?style=for-the-badge&logo=recharts&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-000000?style=for-the-badge&logo=lucide&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-000000?style=for-the-badge&logo=zod&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?style=for-the-badge&logo=react-hook-form&logoColor=white)
![Sharp](https://img.shields.io/badge/Sharp-000000?style=for-the-badge&logo=sharp&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)
![PDF](https://img.shields.io/badge/PDF-FF0000?style=for-the-badge&logo=adobe-acrobat-reader&logoColor=white)
![Excel](https://img.shields.io/badge/Excel-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white)

</div>

## ✨ Features

### 📊 Core Functionality
- **Student Management**: Comprehensive student profiles with photos, contact details, and class assignments
- **Class Management**: Create and organize classes with detailed information and student lists
- **Real-time Attendance Tracking**: Mark attendance with Present, Absent, and Late statuses using webcam or manual entry
- **Advanced Filtering & Search**: Filter by date, class, student, hour, and month with powerful search capabilities
- **Reports & Analytics**: Generate detailed PDF/Excel reports with charts and statistics
- **Dashboard Analytics**: Live attendance trends, statistics cards, and interactive charts

### 🔔 Notification System
- **Real-time Notifications**: Instant updates for attendance changes, student additions, and system events
- **Smart Cleanup**: Automatic cleanup of old notifications with configurable retention
- **Interactive Management**: Mark as read, bulk actions, unread counters, and notification history

### 🎨 Modern UI/UX
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Intuitive Navigation**: Clean sidebar with organized sections and quick actions
- **Beautiful Components**: Premium UI built with Radix UI primitives and Tailwind CSS
- **Animations**: Smooth transitions and micro-interactions with Framer Motion

### 🔧 Technical Features
- **Type-Safe Development**: Full TypeScript with strict typing and Zod validation
- **Database Management**: PostgreSQL with Drizzle ORM for efficient, type-safe queries
- **File Uploads**: Secure image uploads with UploadThing and image cropping
- **Authentication**: NextAuth.js with JWT tokens, role-based access, and secure sessions
- **Offline Support**: Network monitoring, offline indicators, and graceful degradation
- **Performance Optimized**: Next.js 16 with React 19, server components, and edge runtime
- **Data Export**: PDF and Excel report generation with charts and tables
- **Webcam Integration**: Camera-based attendance marking with React Webcam
- **Form Handling**: Advanced forms with React Hook Form and validation
- **Charts & Visualizations**: Interactive charts with Recharts for attendance analytics

### 👥 User Management
- **Role-Based Access**: Admin and user roles with different permissions
- **User Registration**: Secure registration with email verification
- **Password Management**: Forgot password, reset password, and secure authentication
- **Profile Management**: User profiles with avatars and preferences

### 📱 Additional Features
- **Image Cropping**: Built-in image cropper for profile pictures
- **Date Picker**: Advanced date selection with calendar components
- **Toast Notifications**: Beautiful toast messages with Sonner
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Comprehensive error boundaries and user-friendly messages
- **Accessibility**: WCAG compliant components and keyboard navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon, Supabase, or local)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/studenttracker.git
   cd studenttracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure your `.env.local`:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   UPLOADTHING_TOKEN=your_uploadthing_token
   ```

4. **Database Setup**
   ```bash
   # Generate and run migrations
   npx drizzle-kit generate
   npx drizzle-kit migrate

   # Seed with sample data
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and login with:

## 📁 Project Structure

```
attendance-next-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/            # Authentication page
│   └── globals.css       # Global styles
├── components/            # Reusable UI components
├── lib/                  # Utilities and database
├── scripts/              # Database scripts
├── public/               # Static assets
└── drizzle/              # Database migrations
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: Temporary admin login (expandable)
- **File Uploads**: UploadThing
- **Charts**: Recharts
- **Icons**: Lucide React

## 📜 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with sample data
npm run cleanup-notifications  # Clean old notifications
```

## 🔒 Security

- Environment variables for sensitive data
- Type-safe database queries
- Input validation with Zod
- Secure file upload handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database ORM [Drizzle](https://orm.drizzle.team/)

---

**Made with ❤️ for educational institutions worldwide**
