# OtaNet iOS Application

A native React Native/Expo mobile client for OtaNet - a free online manga reader. Browse, search, and read thousands of manga directly on your iOS device.

## Features

- **Browse & Search** - Search for manga by title with instant results
- **Read Manga** - Full-featured chapter reader with page navigation
- **Bookmarks** - Save your favorite manga for quick access
- **Read History** - Track which chapters you've already read
- **Offline Support** - Cache pages for offline reading (coming soon)
- **Same Backend** - Uses the same Flask API as the web version

## Getting Started

### Prerequisites

Before you start, ensure you have:

- **Node.js 16+** installed
- **Expo CLI**: `npm install -g expo-cli`
- **Xcode** (for iOS Simulator) or **Expo Go app** on a physical device
- **iOS device or simulator** running iOS 13+

### Installation

1. **Navigate to the project directory:**

   ```bash
   cd ios_app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   **Note:** The project uses `.npmrc` to handle peer dependency resolution automatically. If you encounter dependency errors, this is already configured.

3. **Configure the API endpoint** (optional):

   The app is pre-configured to use **https://ota-network.com** by default.

   To use a different API endpoint, create a `.env.local` file in the `ios_app` directory:

   ```
   EXPO_PUBLIC_API_BASE=https://your-custom-endpoint.com
   ```

   For local development testing with Flask on port 5001:

   ```
   EXPO_PUBLIC_API_BASE=http://192.168.1.100:5001
   ```

   (Replace `192.168.1.100` with your computer's local IP)

### Running the App

**Option 1: Expo Go (easiest for testing)**

```bash
expo start
```

Then scan the QR code with Expo Go on your iOS device.

**Option 2: iOS Simulator**

```bash
expo start
# Press 'i' to open in iOS Simulator
```

**Option 3: EAS Build (for production)**

```bash
eas build --platform ios
```

## Project Structure

```
ios_app/
├── App.js                     # Application entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── src/
│   ├── navigation/
│   │   └── Navigation.js      # Bottom tab navigation setup
│   ├── screens/
│   │   ├── HomeScreen.js      # Home/Featured manga
│   │   ├── RecentScreen.js    # Recent releases (paginated)
│   │   ├── MangaDetailScreen.js # Manga details & chapters
│   │   ├── ChapterReaderScreen.js # Full-Featured chapter reader
│   │   ├── SearchScreen.js    # Search by title/tags
│   │   └── BookmarksScreen.js # Saved bookmarks
│   ├── components/
│   │   └── MangaCard.js       # Reusable manga card component
│   ├── api/
│   │   └── apiService.js      # Flask API wrapper with caching
│   ├── utils/
│   │   └── storageService.js  # AsyncStorage for bookmarks & history
│   └── config.js              # App configuration
└── assets/                    # Icon, splash, etc.
```

## API Integration

The app communicates with the same Flask backend as the web version. The API service layer in `src/api/apiService.js` provides:

- **getMangaDetails(hash)** - Get manga information
- **getChapters(hash)** - Get all chapters for a manga
- **getChapterPages(hash, chapter)** - Get pages for a chapter
- **searchByTitle(query)** - Search manga
- **getRecentManga(page, limit)** - Get recent releases
- **addBookmark(manga)** - Save bookmark locally
- **getBookmarks()** - Retrieve all bookmarks

All API calls include built-in caching (30 minutes default) to minimize backend load.

## Data Storage

The app uses **AsyncStorage** for local persistence:

- **Bookmarks** - Saved manga in `@otanet_bookmarks`
- **Read Chapters** - Chapter history per manga in `@otanet_read_chapters_<hash>`

This data persists across app sessions and works offline.

## Building for Production

### Prerequisites

- Apple Developer Account (required for App Store submission)
- Xcode 14+

### Build Steps

1. **Update version in app.json:**

   ```json
   {
     "expo": {
       "version": "1.0.0"
     }
   }
   ```

2. **Build with EAS:**

   ```bash
   eas build --platform ios --auto-submit
   ```

3. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

See [Expo Deployment Docs](https://docs.expo.dev/deployment/build-project/) for detailed instructions.

## Troubleshooting

### Dependency Installation Issues

If you encounter `ERESOLVE` or peer dependency errors during `npm install`:

- The project is configured with `.npmrc` to use `legacy-peer-deps=true`
- This is needed due to React 19 with Expo's dependencies
- If issues persist, try: `npm install --legacy-peer-deps`
- Then delete `package-lock.json` and run `npm install` again

### App won't connect to API

- **Check the API endpoint** in `.env.local`
- **Verify Flask server is running** on your EC2 instance
- **Use your local IP** for development (e.g., `http://192.168.X.X:5000`)
- **Check CORS settings** in Flask (should allow your dev server)

### Images not loading

- **Verify image URLs** are accessible from your network
- **Check API response** includes valid `cover_img` or image URL fields
- **Clear Expo cache**: `expo start --clear`

### Performance issues

- **Reduce image quality** or implement image resizing
- **Clear AsyncStorage** if it's too large
- **Use Hermes engine** in EAS builds for better performance

## Contributing

To add features or fix bugs:

1. Create a branch: `git checkout -b feature/amazing-feature`
2. Make changes and test thoroughly
3. Submit a pull request

## Performance Notes

- **Caching**: API responses cached for 30 minutes to reduce backend load
- **Image Caching**: In-memory cache for recently viewed images
- **Lazy Loading**: Pages loaded on demand in chapter reader
- **Pagination**: Recent manga loaded in batches of 20

## Future Enhancements

- [ ] Offline reading with downloaded manga
- [ ] Dark mode support
- [ ] Reading progress tracking
- [ ] Advanced tag-based search filtering
- [ ] Recommendation system
- [ ] Push notifications for new chapters
- [ ] Social features (sharing, ratings)

## License

This project follows the same license as the main OtaNet project.

## Support

For issues or feature requests, please open an issue on the GitHub repository or contact the development team.

---

**Happy reading!** 📖
