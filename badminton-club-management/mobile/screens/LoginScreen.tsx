// SmashHub Mobile Login Screen - Pure StyleSheet Version (Animation Commented for Performance Testing)
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buttonAnim] = useState(new Animated.Value(1));
  // const shuttleAnim = useRef(new Animated.Value(0)).current;
  // const shuttleDirection = useRef(1);
  // const rotateAnim = useRef(new Animated.Value(0)).current;

  const passwordRef = useRef(null);
  const buttonRef = useRef(null);
  const inactivityTimeout = useRef(null);
  const INACTIVITY_LIMIT = 30000;

  const handleLogin = async () => {
    setMessage('');
    setIsSubmitting(true);
    animateButton();

    try {
      const API_URL = Constants.expoConfig?.extra?.apiUrl;
      const res = await fetch(`${API_URL}/api/auth/login`, { 
        //const res = await fetch('http://192.168.1.103:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json();

      if (res.ok) {
        await SecureStore.setItemAsync('token', result.token);
        await SecureStore.setItemAsync('clubId', result.user.clubId);
        await SecureStore.setItemAsync('clubName', result.clubName || result.user?.clubName || '');

        switch (result.user.role) {
          case 'SuperAdmin': navigation.navigate('Dashboard', { role: 'SuperAdmin' }); break;
          case 'Club Admin': navigation.navigate('Dashboard', { role: 'ClubAdmin' }); break;
          case 'Parents': navigation.navigate('Dashboard', { role: 'Parents' }); break;
          case 'Independent Coach': navigation.navigate('Dashboard', { role: 'Coach' }); break;
          case 'Tournament Organiser': navigation.navigate('Dashboard', { role: 'Organiser' }); break;
          default: setMessage('Unknown role.');
        }
      } else {
        setMessage(result.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  // const animateShuttle = () => {
  //   const animate = () => {
  //     Animated.timing(shuttleAnim, {
  //       toValue: shuttleDirection.current === 1 ? width : -100,
  //       duration: 4000,
  //       easing: Easing.inOut(Easing.quad),
  //       useNativeDriver: true
  //     }).start(() => {
  //       shuttleDirection.current *= -1;
  //       rotateAnim.setValue(0);
  //       Animated.timing(rotateAnim, {
  //         toValue: 1,
  //         duration: 300,
  //         useNativeDriver: true
  //       }).start(() => {
  //         animate();
  //       });
  //     });
  //   };
  //   animate();
  // };

  // useEffect(() => {
  //   animateShuttle();
  // }, []);

  useEffect(() => {
    if (password.length > 0 && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [password]);

  useEffect(() => {
    if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
    inactivityTimeout.current = setTimeout(() => {
      setUsername('');
      setPassword('');
      setMessage('');
    }, INACTIVITY_LIMIT);
  }, [email, password]);

  // const rotateInterpolate = rotateAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: ['0deg', shuttleDirection.current === 1 ? '20deg' : '-20deg']
  // });

  return (
    <LinearGradient
      colors={["#dbeafe", "#eff6ff", "#e0e7ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* <Animated.Image
          source={require('../assets/shuttle.png')}
          style={[styles.shuttle, {
            transform: [
              { translateX: shuttleAnim },
              { rotate: rotateInterpolate }
            ]
          }]}
        /> */}

        <View style={styles.headerSection}>
          <Text style={styles.title}>SmashHub</Text>
          <Text style={styles.subtitle}>
            SmashHub is your all-in-one badminton club platform — track player skills,
            organize tournaments, Smart PegBoards, and ledger.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setUsername}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
          />

          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
          />

          <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
            <TouchableOpacity
              ref={buttonRef}
              onPress={handleLogin}
              disabled={isSubmitting}
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {message ? <Text style={styles.errorMessage}>{message}</Text> : null}
        </View>

        <Text style={styles.signupText}>
  Not a member?{' '}
  <Text
    style={styles.signupLink}
    onPress={() => navigation.navigate('Signup')}
  >
    Sign up now
  </Text>
</Text>

      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1e3a8a',
    marginBottom: 16,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1e40af',
    textAlign: 'center'
  },
  formContainer: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    })
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 18,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#dc2626',
    marginTop: 16,
    fontWeight: '500',
  },
  signupText: {
    marginTop: 24,
    color: '#1e3a8a',
    fontSize: 16,
    textAlign: 'center'
  },
  signupLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  },
  shuttle: {
    position: 'absolute',
    top: 60,
    width: 50,
    height: 50,
    resizeMode: 'contain'
  }
});
