// Ambient module declarations to avoid TS errors before installing optional native deps.
declare module 'expo-notifications';
declare module 'react-native-svg';
declare module 'moti';
declare module 'uuid';

// Allow importing JSON files without types
declare module '*.json' {
  const value: any;
  export default value;
}
