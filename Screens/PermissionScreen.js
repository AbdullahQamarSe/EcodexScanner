import React, { useEffect } from 'react';
import { View, Text, Alert, StyleSheet, BackHandler } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const PermissionScreen = ({ navigation }) => {
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const cameraPermission = await request(PERMISSIONS.ANDROID.CAMERA); // For Android
      const storagePermission = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE); // For Android
      const galleryPermission = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE); // For Android

      if (
        cameraPermission === RESULTS.GRANTED &&
        storagePermission === RESULTS.GRANTED &&
        galleryPermission === RESULTS.GRANTED
      ) {
        navigation.replace('YellowScreen'); // If permissions granted, navigate to yellow screen
      } else {
        Alert.alert('Permissions denied', 'The app will now close.');
        setTimeout(() => {
          // Close the app after a delay
          BackHandler.exitApp();
        }, 2000);
      }
    } catch (error) {
      console.error('Permission error: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Requesting Permissions...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
  },
});

export default PermissionScreen;
