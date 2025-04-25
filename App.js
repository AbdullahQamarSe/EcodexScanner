import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  PermissionsAndroid,
  Platform,
  ScrollView ,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Modal,
  FlatList,
  StyleSheet ,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { Linking } from 'react-native';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);

// Or hide specific warnings only
LogBox.ignoreLogs([
  'Warning: Each child in a list', // add specific messages
]);

const API_URL = 'http://192.168.100.10:8000/extract-and-match/';



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
  const [Email, setEmail] = useState('');
  const [ratingProductType, setRatingProductType] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [checkproductId, setcheckproductId] = useState(null);
  const [ratingList, setRatingList] = useState([]);
const [viewRatingModalVisible, setViewRatingModalVisible] = useState(false);


  const fetchRatings = async (productId, storetype) => {
    try {
      const url = `http://192.168.100.10:8000/product/${productId}/storetype/${storetype}`;
      console.log(url);
      const response = await axios.get(url);
  
      const { product_type, reviews } = response.data;
      setRatingProductType(product_type);
      // You can optionally use product_type somewhere if needed
      console.log("Product Type:", response.data);
      setRatingList(reviews);  // <-- Only set the reviews part to be displayed
  
      setViewRatingModalVisible(true);
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
      Alert.alert("Error", "Could not load ratings.");
    }
  };
  
  
  const submitRating = async () => {
    if (selectedStars === 0 || comment.trim() === '') {
      Alert.alert('Please give a rating and write a comment.');
      return;
    }
  
    try {
      const payload = {
        email: Email,
        rating: selectedStars,
        comment: comment,
        product_id: selectedProductId,
        storetype:checkproductId,
      };
      console.log(payload)
      const url = `http://192.168.100.10:8000/product/${selectedProductId}/add-review/`;
      console.log(url)
      await axios.post(url, payload);
      Alert.alert('Success', 'Rating submitted successfully.');
      setRatingModalVisible(false);
      setSelectedStars(0);
      setComment('');
    } catch (error) {
      console.error('Rating submission failed:', error);
      Alert.alert('Error', 'You Already Review This Product.');
    }
  };
  

  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setEmail(user.email);  // Retrieve and show the user's name
      }
    };
    checkLoginStatus();
  }, []);

  const sendImageToBackend = async (imageUri) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    if (Email) {
      formData.append('email', Email);
    }
    console.log(Email)
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
      <Image source={{ uri: `http://192.168.100.10:8000${item.image}` }} style={styles.productImage} />
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
      <View>
        <Text></Text>
        <TouchableOpacity
          style={styles.AddRatting}
          onPress={() => {
            setRatingModalVisible(true);
            setSelectedProductId(item.id);
            setcheckproductId(item.storetype);
          }}
        >
        <Text style={styles.TextStyle}>Add Rating</Text>
      </TouchableOpacity>
      <Text></Text>
      <TouchableOpacity 
        style={styles.ViewRatting} 
        onPress={() => {
          fetchRatings(item.id, item.storetype);
        }}
      >
        <Text style={styles.TextStyle}>View Rating</Text>
      </TouchableOpacity>
      </View>
    </View>
  );

  


  const openWebLink = (url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    Linking.openURL(url);
  };

  const openMap = (location) => {
    if (!location) {
      Alert.alert('Error', 'No location specified.');
      return;
    }
    console.log("location ", location)
    Linking.openURL(location);
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
                ...(Array.isArray(productData.online_products) ? productData.online_products : []),
                ...(Array.isArray(productData.offline_products) ? productData.offline_products : [])
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

      <Modal
  visible={ratingModalVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setRatingModalVisible(false)}
>
  <View style={styles.ratingModalContainer}>
    <View style={styles.ratingModalBox}>
      <Text style={styles.modalTitle}>Rate this Product</Text>

      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setSelectedStars(star)}>
            <Text style={[styles.star, selectedStars >= star && styles.selectedStar]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.commentBox}
        placeholder="Write your comment..."
        multiline
        numberOfLines={4}
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity style={styles.submitButton} onPress={submitRating}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal
  visible={viewRatingModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setViewRatingModalVisible(false)}
>
  <View style={styles.ratingModalContainer}>
    <View style={styles.ratingModalBox}>
    <Text style={styles.modalTitle}>Reviews From People ({ratingProductType})</Text>

      {ratingList.length === 0 ? (
        <Text>No ratings available.</Text>
      ) : (
        <FlatList
          data={ratingList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewUser}>{item.email || 'Anonymous'}</Text>
              <Text style={styles.reviewStars}>⭐ {item.rating}</Text>
              <Text style={styles.reviewComment}>{item.comment}</Text>
              <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
      <TouchableOpacity onPress={() => setViewRatingModalVisible(false)}>
        <Text style={styles.cancelButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


    </View>
  );
};


const HomeScreen = () => {
  const [email, setEmail] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setEmail(user.email);
        fetchHistory(user.email);
      }
    };

    const fetchHistory = async (userEmail) => {
      try {
        const response = await axios.post('http://192.168.100.10:8000/history-by-email/', {
          email: userEmail,
        });
        setHistory(response.data);
      } catch (error) {
        console.log('Error fetching history:', error);
      }
    };

    checkLoginStatus();
  }, []);

  const renderItem = ({ item }) => (
    <View
      style={{
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
      }}
    >
      <Image source={{ uri: `http://192.168.100.10:8000${item.image}` }} style={styles.productImage} />
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{item.name}</Text>
      <Text style={{ fontSize: 16, color: '#555', marginTop: 4 }}>Price: {item.price}</Text>
      <Text style={{ fontSize: 16, color: '#555' }}>Store: {item.store}</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0f4f7', padding: 20 }}>
      
      <View
        style={{
          padding: 20,
          backgroundColor: '#4a90e2',
          borderRadius: 12,
          marginBottom: 25,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
          Welcome to ECodex
        </Text>

        {email ? (
          <>
            <Text style={{ fontSize: 16, color: '#e0e0e0', marginTop: 6 }}>
              Logged in as: <Text style={{ fontWeight: 'bold' }}>{email}</Text>
            </Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 6 }}>
              History
            </Text>
          </>
        ) : (
          <>
            
          </>
        )}
      </View>


      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

const AccountScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  

  // Check if the user is already logged in when the component mounts
  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUserName(user.name);
        setEmail(user.email);  // Retrieve and show the user's name
      }
    };
    checkLoginStatus();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleLogin = async () => {
    console.log('Login with:', formData.email, formData.password);
  
    try {
  
      const response = await fetch('http://192.168.100.10:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const data = await response.json(); // Parse response body
  
      if (response.ok) {
        await AsyncStorage.setItem('user', JSON.stringify(data));  // Store user info
        setIsAuthenticated(true);
        setUserName(data.name);
      } else {
        const errorMsg = data.detail || data.error || JSON.stringify(data);
        alert(`Login failed: ${errorMsg}`);
      }
    } catch (error) {
      alert(`Login error: ${error.message}`);
    }
  };
  
  
  

  const handleSignup = async () => {
    console.log('Signup with:', formData.name, formData.email, formData.password);
    
    try {
  
      const response = await fetch('http://192.168.100.10:8000/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const data = await response.json(); // Parse the response body
  
      if (response.ok) {
        alert('Signup successful');
        setIsLogin(true); // Switch to login view after successful signup
      } else {
        const errorMsg = data.detail || data.error || JSON.stringify(data);
        alert(`Signup failed: ${errorMsg}`);
      }
    } catch (error) {
      alert(`Signup error: ${error.message}`);
    }
  };
  
  
  

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');  // Remove user data from AsyncStorage
    setIsAuthenticated(false);
    setUserName('');
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenText}>Manage Your Account</Text>

      {isAuthenticated ? (
        <View>
          <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {/* Buttons for switching between login/signup */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, isLogin && styles.activeButton]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, !isLogin && styles.activeButton]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={styles.buttonText}>Signup</Text>
            </TouchableOpacity>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={isLogin ? handleLogin : handleSignup}
          >
            <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Signup'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


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
  ratingModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  ratingModalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center'
  },
  starContainer: {
    flexDirection: 'row',
    marginVertical: 10
  },
  star: {
    fontSize: 30,
    color: '#ccc',
    marginHorizontal: 5
  },
  selectedStar: {
    color: '#FFD700'
  },
  commentBox: {
    width: '100%',
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    textAlignVertical: 'top'
  },
  submitButton: {
    backgroundColor: '#08a494',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  cancelButtonText: {
    color: '#ff4444'
  },  
  AddRatting: {
    backgroundColor: '#34c97c',
    width: 140,
    height: 30,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    paddingHorizontal: 20,
  },
  
  ViewRatting: {
    backgroundColor: '#2fa76b',
    width: 140,
    height: 30,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    paddingHorizontal: 20,
  },
  
  TextStyle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  itemContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
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
    color: '#08a494',
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
  },
  screenText: {
    fontSize: 24,
    marginBottom: 20,
    color:'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  button: {
    padding: 10,
    margin: 5,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: '#08a494',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    width: '80%',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    width:200,
    borderRadius: 5,  
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#08a494',
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  welcomeText: {
    fontSize: 20,
    marginBottom: 20,
    color:'white',
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
