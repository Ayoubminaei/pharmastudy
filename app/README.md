# PharmaStudy 📚💊

A beautiful, feature-rich web application for pharmacy students to organize their study materials, track molecules, enzymes, and medications, create flashcards, and export study materials to PDF.

![PharmaStudy Banner](https://via.placeholder.com/800x400/0070a0/ffffff?text=PharmaStudy)

## Features ✨

### 🔐 Authentication
- Secure login and signup with email/password
- Google and GitHub OAuth support
- Password strength indicator
- User profile management

### 📖 Chapter Management
- Create, edit, and delete chapters
- Color-code your chapters for easy organization
- View topic count for each chapter
- Beautiful card-based UI with 3D hover effects

### 📝 Topic Management
- Organize topics within chapters
- Timeline-style layout with visual connections
- Edit and delete topics
- Track item count per topic

### 🧪 Study Items (Molecules, Enzymes, Medications)
- Add molecules, enzymes, and medications
- **PubChem Integration**: Search and import data directly from PubChem
- Add images, descriptions, structure details
- Track mechanism of action, uses, and effects
- Export to PDF format

### 🎯 Flashcards
- Interactive flashcard mode with 3D flip animation
- Filter by chapter, topic, or type
- Shuffle cards for randomized study
- Track mastered items
- Progress tracking

### 🎮 Quiz Mode
- Auto-generated quizzes from your study items
- Multiple choice questions
- Score tracking and feedback
- Customizable question count

### 📊 Dashboard
- Overview of your study progress
- Quick actions for common tasks
- Recent activity tracking
- Statistics visualization

## Tech Stack 🛠️

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: GSAP + Three.js (molecular background)
- **Backend/Auth**: Supabase
- **PDF Export**: jsPDF
- **External API**: PubChem

## Getting Started 🚀

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pharmastudy.git
cd pharmastudy
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment 📦

See the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to:
- **Supabase** (database and authentication)
- **GitHub** (code repository)
- **Vercel** (hosting)

## Database Schema 🗄️

### Tables

#### `profiles`
- `id` (UUID, PK) - User ID from auth.users
- `email` (TEXT) - User email
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - Profile picture URL
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `chapters`
- `id` (UUID, PK)
- `user_id` (UUID, FK) - Owner
- `title` (TEXT) - Chapter name
- `description` (TEXT) - Optional description
- `color` (TEXT) - Hex color code
- `icon` (TEXT) - Optional icon
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `topics`
- `id` (UUID, PK)
- `chapter_id` (UUID, FK) - Parent chapter
- `user_id` (UUID, FK) - Owner
- `title` (TEXT) - Topic name
- `description` (TEXT) - Optional description
- `order_index` (INTEGER) - For sorting
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `study_items`
- `id` (UUID, PK)
- `topic_id` (UUID, FK) - Parent topic
- `user_id` (UUID, FK) - Owner
- `type` (TEXT) - 'molecule', 'enzyme', or 'medication'
- `name` (TEXT) - Item name
- `description` (TEXT) - General description
- `image_url` (TEXT) - Image URL
- `structure_description` (TEXT) - Molecular structure info
- `mechanism_description` (TEXT) - Mechanism of action
- `uses` (TEXT) - Clinical uses
- `effects` (TEXT) - Side effects
- `pubchem_cid` (TEXT) - PubChem Compound ID
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Screenshots 📸

### Login Page
![Login](https://via.placeholder.com/400x300/0070a0/ffffff?text=Login)

### Dashboard
![Dashboard](https://via.placeholder.com/400x300/0070a0/ffffff?text=Dashboard)

### Chapters
![Chapters](https://via.placeholder.com/400x300/0070a0/ffffff?text=Chapters)

### Flashcards
![Flashcards](https://via.placeholder.com/400x300/0070a0/ffffff?text=Flashcards)

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [PubChem](https://pubchem.ncbi.nlm.nih.gov/) - For providing the chemical compound database
- [shadcn/ui](https://ui.shadcn.com/) - For the beautiful UI components
- [Supabase](https://supabase.com/) - For the backend infrastructure
- [Vercel](https://vercel.com/) - For the hosting platform

## Support 💬

If you have any questions or need help, please:
1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Open an issue on GitHub
3. Contact the maintainer

---

Made with ❤️ for pharmacy students everywhere!
