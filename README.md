# SupaBucket Explorer

A desktop application for exploring and downloading files from Supabase Storage buckets.

## Features

- Authenticate with Supabase using email and password
- Browse storage buckets with nested folder support
- Select multiple files and folders for download
- Download while preserving the original folder structure
- Progress tracking and graceful error handling

## Tech Stack

- Electron + Electron Forge
- Vue 3 + TypeScript
- Tailwind CSS
- Vite
- Supabase JS client
- Pinia for state management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Supabase project with storage configured
- A supabase user with an associated profile.role = 'admin'
- An storage.buckets read access policy for authenticated users where profile.role = 'admin'
- An storage.objects read access policy for authenticated users where profile.role = 'admin' on each bucket

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd supabase-bucket-explorer
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file in the root directory for development:
```env
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** The Supabase anon key will be entered directly in the app's login form, so you don't need to configure it in `.env`.

### Running the Application

Development mode:
```bash
npm start
```

Build for production:
```bash
npm run package
```

## Usage

1. **Login**: Enter your Supabase project ID, email, and password
2. **Select Destination**: Click "Browse" to choose where to download files
3. **Select Files**: Check the boxes next to files and folders you want to download
4. **Transfer**: Click the "Transfer" button to start the download process
5. **Monitor Progress**: Watch the progress bar as files are downloaded

## Project Structure

```
src/
├── main/           # Electron main process
│   └── index.ts   # Main entry and IPC handlers
├── preload/        # Context bridge
│   └── index.ts   # Secure API exposure
├── renderer/       # Vue app
│   ├── App.vue
│   ├── main.ts
│   ├── components/
│   │   ├── LoginForm.vue
│   │   ├── DownloadDestination.vue
│   │   ├── BucketExplorer.vue
│   │   ├── TransferButton.vue
│   │   └── FileTreeItem.vue
│   ├── stores/
│   │   └── auth.ts
│   └── types/
│       └── supabase.ts
└── index.css       # Tailwind imports
```

## Development

The app follows standard Electron architecture:
- **Main Process**: Handles file operations and window management
- **Preload Script**: Exposes secure APIs to the renderer
- **Renderer Process**: Vue.js frontend

## License

ISC

