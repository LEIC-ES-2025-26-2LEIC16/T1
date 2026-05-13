jest.mock('expo-router', () => {
  const mockFn = () => {};
  return {
    useRouter: () => ({
      push: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    Link: 'Link',
    router: {
      push: jest.fn(),
      back: jest.fn(),
    },
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

let _mockCurrentUser: null | { uid: string; email?: string; displayName?: string | null } = null;
const mockAuthState = {
  get currentUser() { return _mockCurrentUser; },
  set currentUser(v) { _mockCurrentUser = v; },
};
jest.mock('@firebase/auth', () => ({
  getReactNativePersistence: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
  getAuth: jest.fn(() => mockAuthState),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'collection-ref'),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(() => 'doc-ref'),
  onSnapshot: jest.fn(() => jest.fn()),
  serverTimestamp: jest.fn(() => new Date()),
  query: jest.fn(() => 'query-ref'),
  where: jest.fn(),
  orderBy: jest.fn(),
  arrayUnion: jest.fn(() => 'array-union'),
  arrayRemove: jest.fn(() => 'array-remove'),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getFirestore: jest.fn(() => 'mock-firestore'),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: {} },
    manifest: {},
  },
  ExpoConfig: {},
}));
