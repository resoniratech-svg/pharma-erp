// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// const SplashScreen = () => {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.logo}>Pharma ERP</Text>
//       <Text>Loading...</Text>
//     </View>
//   );
// };

// export default SplashScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   logo: {
//     fontSize: 30,
//     fontWeight: 'bold',
//   },
// });
import React, { useEffect } from 'react';
import { View, Text, StyleSheet,Image  } from 'react-native';

const SplashScreen = ({ navigation }: any) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Elegant logo container (acts as badge to look premium) */}
      <View style={styles.logoBadgeContainer}>
        <Image 
          source={require('../../../assets/images/logo.png')} 
          style={styles.logoImage} 
          resizeMode="cover"
        />
      </View>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoBadgeContainer: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 204,
    height: 78,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoImage: {
    width: 215,
    height: 85,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 8,
  },
});