# SmashHub Mobile (Expo + Android)

## 📁 Folder Structure
Place this inside: `badminton-club-management/mobile/`

## 🚀 Setup Instructions

### 1. Navigate to Mobile App
```bash
cd badminton-club-management/mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Dev Server (Tunnel for Android)
```bash
npm start -- --tunnel
```

### 4. Build APK (Optional)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

### 🔗 API Endpoint
Update `BASE_URL` in `services/api.ts` to your local IP if testing on a real device.




npm install --legacy-peer-deps
npx expo install expo-linear-gradient
npx expo install react-native-vector-icons
npx expo install @expo/vector-icons
npm install nativewind
npm install @react-native-picker/picker
npm install dotenv
