const fs = require('fs');
const path = require('path');

// Fix react-native-iap podspec to handle RCT-Folly dependency correctly
// RCT-Folly is provided by React Native through ReactNativeDependencies
const podspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-iap',
  'RNIap.podspec'
);

if (fs.existsSync(podspecPath)) {
  let podspecContent = fs.readFileSync(podspecPath, 'utf8');
  
  // Check if RCT-Folly dependency exists
  if (podspecContent.includes('RCT-Folly')) {
    // Remove explicit RCT-Folly dependency
    // It's provided by React Native's ReactNativeDependencies pod
    podspecContent = podspecContent.replace(
      /s\.dependency\s+['"]RCT-Folly['"]\s*,?\s*\n?/g,
      ''
    );
    
    // Also remove any trailing commas that might be left
    podspecContent = podspecContent.replace(/,\s*\n\s*s\.dependency/g, '\n  s.dependency');
    
    fs.writeFileSync(podspecPath, podspecContent, 'utf8');
    console.log('✅ Fixed react-native-iap podspec: Removed RCT-Folly dependency');
  } else {
    console.log('ℹ️  react-native-iap podspec does not have RCT-Folly dependency');
  }
} else {
  console.log('⚠️  react-native-iap podspec not found, skipping fix');
}

