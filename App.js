import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { Linking } from 'react-native';

const API_URL = 'http://192.168.18.5:8000/api/extract-and-match/';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(onFinish, 4000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.splashContainer}>
      <Animated.Text style={[styles.splashText, { opacity: fadeAnim }]}>ECodex</Animated.Text>
    </View>
  );
};

const CameraScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendImageToBackend = async (imageUri) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProductData(response.data);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
      console.error('Backend error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openGallery = async () => {
    const options = { mediaType: 'photo' };
    const result = await launchImageLibrary(options);
    if (result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      sendImageToBackend(imageUri);
    }
  };

  const openCamera = async () => {
    const options = { mediaType: 'photo', saveToPhotos: true };
    const result = await launchCamera(options);
    if (result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      sendImageToBackend(imageUri);
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: `http://192.168.18.5:8000${item.image}` }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>PKR: {item.price}</Text>
      <Text style={styles.productDescription}>{item.description}</Text>
      {item.websitelink && (
        <Text
          style={styles.productLink}
          onPress={() => openWebLink(item.websitelink)}
        >
          Visit Website
        </Text>
      )}
      {item.storelocation && (
        <Text
          style={styles.productLocation}
          onPress={() => openMap(item.storelocation)}
        >
          🛒 Store Location (Offline)
        </Text>
      )}
    </View>

  );

  const openWebLink = (url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    Linking.openURL(url)
  };
  

  const openMap = (location) => {
    if (!location) {
      Alert.alert('Error', 'No location specified.');
      return;
    }
    console.log("location ",location)
    Linking.openURL(location)
    
  };
  
  

  return (
    <View style={styles.cameraScreenContainer}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#08a494" />
          <Text style={styles.loadingText}>Processing Image...</Text>
        </View>
      )}

      {!isLoading && (
        <>
          <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
            <Text style={styles.cameraButtonText}>Open Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={openGallery}>
            <Text style={styles.cameraButtonText}>Open Gallery</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Product Details</Text>
          {productData ? (
            <FlatList
              data={[
                ...productData.online_products.map((item) => ({ ...item, key: `online-${item.id}` })),
                ...productData.offline_products.map((item) => ({ ...item, key: `offline-${item.id}` })),
              ]}
              keyExtractor={(item) => item.key}
              renderItem={renderProduct}
            />
          ) : (
            <Text style={styles.noDataText}>No products found.</Text>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const HomeScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenText}>Welcome to ECodex</Text>
  </View>
);

const AccountScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenText}>Manage Your Account</Text>
  </View>
);

const CustomBottomNavigation = ({ navigation }) => (
  <View style={styles.bottomNavContainer}>
    <TouchableOpacity style={styles.navItem} onPress={() => navigation('Home')}>
      <Text style={styles.navText}>Home</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItemCenter} onPress={() => navigation('Camera')}>
      <Image source={require('./Images/camera_icon.png')} style={styles.navCenterIcon} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItem} onPress={() => navigation('Account')}>
      <Text style={styles.navText}>Account</Text>
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('Home');

  useEffect(() => {
    if (!showSplash) {
      requestCameraPermission();
    }
  }, [showSplash]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
      }
    } else {
      setPermissionGranted(true);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Camera':
        return <CameraScreen />;
      case 'Account':
        return <AccountScreen />;
      default:
        return <HomeScreen />;
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!permissionGranted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required to proceed.</Text>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <Text style={styles.historyText}>Scan Product To Get Better Prices</Text>
      {renderScreen()}
      <CustomBottomNavigation navigation={setCurrentScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  splashText: {
    fontSize: 42,
    color: '#08a494',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center',
  },
  cameraScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  cameraButton: {
    width: 120,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#08a494',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productCard: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 15,
    lineHeight: 22,
  },
  productLink: {
    fontSize: 16,
    color: '#1E90FF',
    textDecorationLine: 'underline',
    marginBottom: 10,
    fontWeight: '500',
  },
  productLocation: {
    fontSize: 16,
    color: '#FFD700',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#08a494',
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  screenText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#333',
  },
  navItem: {
    alignItems: 'center',
  },
  navItemCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#08a494',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  navText: {
    fontSize: 12,
    color: '#08a494',
    marginTop: 4,
  },
  navCenterIcon: {
    width: 30,
    height: 30,
    tintColor: 'white',
    resizeMode: 'contain',
  },
  historyText: {
    fontSize: 22, 
    color: 'white',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#08a494',
  },
});
