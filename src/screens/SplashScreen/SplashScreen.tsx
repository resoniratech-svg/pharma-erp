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
      {/* <Text style={styles.logo}>Pharma ERP</Text> */}
<Image 
  source={require('../../../assets/images/logo.png')} 
  style={styles.logoImage} 
  resizeMode="contain"
/>
      <Text>Loading...</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // logo: {
  //   fontSize: 30,
  //   fontWeight: 'bold',
  // },
  logoImage: {
  width: 250,
  height: 100,
  alignSelf: 'center',
  marginBottom: 10,
},
});