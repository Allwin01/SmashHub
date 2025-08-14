// SmashHub Mobile Signup Screen - Enhanced with Unified Gradient Background, Accessibility & Responsive Layout
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: '',
    surName: '',
    email: '',
    password: '',
    phone: '',
    address1: '',
    address2: '',
    postcode: '',
    county: '',
    country: '',
    role: '',
    clubName: '',
    clubCity: '',
    clubAddress: '',
    selectedClub: ''
  });

  const [clubOptions, setClubOptions] = useState<{ _id: string, name: string }[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [screenOrientation, setScreenOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const roles = ['Club Admin', 'Parents', 'Tournament Organiser', 'Independent Coach'];

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setScreenOrientation(width > height ? 'landscape' : 'portrait');
    };
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    updateOrientation();
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const API_URL = Constants.expoConfig.extra.apiUrl;
        const res = await fetch(`${API_URL}/api/clubs`);
        const data = await res.json();
        setClubOptions(data.clubs || []);
      } catch (err) {
        console.error('Error loading clubs:', err);
        setClubOptions([]);
      }
    };
    if (formData.role === 'Parents') fetchClubs();
    else setClubOptions([]);
  }, [formData.role]);

  const getPasswordStrength = (password: string) => {
    const score = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ].filter(Boolean).length;
    return score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong';
  };

  const handleChange = (name, value) => {
    if (name === 'phone') value = value.replace(/[^0-9+]/g, '');
    if (name === 'password') setPasswordStrength(getPasswordStrength(value));
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'email' ? { username: value } : {}),
      ...(name === 'selectedClub' ? { selectedClub: value } : {})
    }));
  };

  const validateForm = () => {
    const requiredFields = ['firstName', 'surName', 'email', 'password', 'role', 'phone', 'address1', 'postcode', 'county', 'country'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert('Validation Error', `Please fill in the ${field} field.`);
        return false;
      }
    }
    if (formData.role === 'Parents' && !formData.selectedClub) {
      Alert.alert('Validation Error', 'Please select a club.');
      return false;
    }
    if (formData.role === 'Club Admin') {
      if (!formData.clubName || !formData.clubAddress || !formData.clubCity) {
        Alert.alert('Validation Error', 'Please enter club name, address, and city.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    const API_URL = Constants.expoConfig?.extra?.apiUrl;
    if (!validateForm()) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (res.ok) {
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          navigation.navigate('Login');
        }, 2500);
      } else setMessage(`❌ ${result.message || 'Signup failed'}`);
    } catch (error) {
      console.error(error);
      setMessage('❌ Server error, please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthBarColor = (strength: string) => {
    switch (strength) {
      case 'Weak': return 'red';
      case 'Medium': return 'orange';
      case 'Strong': return 'green';
      default: return 'gray';
    }
  };

  const strengthIcons = {
    Weak: 'frown',
    Medium: 'meh',
    Strong: 'smile'
  };

  const strengthTips = [
    '8+ characters',
    'Upper & lowercase letters',
    'A number',
    'A special character'
  ];

  const isTablet = Dimensions.get('window').width >= 768;
  const isMobile = Dimensions.get('window').width < 768;

  return (
    <LinearGradient colors={["#dbeafe", "#eff6ff", "#e0e7ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 40,
          paddingHorizontal: isTablet ? 80 : 16,
        }}
      >
        <View style={{ width: '100%', maxWidth: 700 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#1e3a8a', textAlign: 'center' }}>Signup</Text>

          <View
            style={{
              backgroundColor: '#f8fafc',
              padding: 20,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5
            }}
          >


          <TextInput style={styles.input} placeholder="First Name" value={formData.firstName} onChangeText={(val) => handleChange('firstName', val)} />
          <TextInput style={styles.input} placeholder="Surname" value={formData.surName} onChangeText={(val) => handleChange('surName', val)} />
          <TextInput style={styles.input} placeholder="Email Address" value={formData.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Phone Number" value={formData.phone} onChangeText={(val) => handleChange('phone', val)} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Address Line 1" value={formData.address1} onChangeText={(val) => handleChange('address1', val)} />
          <TextInput style={styles.input} placeholder="Address Line 2" value={formData.address2} onChangeText={(val) => handleChange('address2', val)} />
          <TextInput style={styles.input} placeholder="Postcode" value={formData.postcode} onChangeText={(val) => handleChange('postcode', val)} />
          <TextInput style={styles.input} placeholder="County" value={formData.county} onChangeText={(val) => handleChange('county', val)} />
          <TextInput style={styles.input} placeholder="Country" value={formData.country} onChangeText={(val) => handleChange('country', val)} />

          <TextInput style={styles.input} placeholder="Password" value={formData.password} onChangeText={(val) => handleChange('password', val)} secureTextEntry />

          {formData.password.length > 0 && (
            <View style={{ marginTop: 4 }}>
              <View style={{ height: 6, borderRadius: 4, backgroundColor: '#e5e7eb', marginBottom: 4 }}>
                <View style={{
                  height: 6,
                  width: `${passwordStrength === 'Weak' ? 33 : passwordStrength === 'Medium' ? 66 : 100}%`,
                  backgroundColor: getStrengthBarColor(passwordStrength),
                  borderRadius: 4,
                  transition: 'width 0.3s ease'
                }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name={strengthIcons[passwordStrength]} size={16} color={getStrengthBarColor(passwordStrength)} style={{ marginRight: 6 }} />
                <Text style={{ color: getStrengthBarColor(passwordStrength), fontWeight: '600' }}>Strength: {passwordStrength}</Text>
              </View>
              {strengthTips.map((tip, index) => (
                <Text key={`tip-${index}`} style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>• {tip}</Text>
              ))}
            </View>
          )}

          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Role</Text>
          <View style={{ borderColor: '#ccc', borderWidth: 1, borderRadius: 6, marginVertical: 6 }}>
            <Picker
              selectedValue={formData.role}
              onValueChange={(itemValue) => handleChange('role', itemValue)}>
              <Picker.Item label="-- Select Role --" value="" />
              {roles.map((role, idx) => (
                <Picker.Item key={`role-${idx}`} label={role} value={role} />
              ))}
            </Picker>
          </View>

          {formData.role === 'Parents' && (
            <View style={{ borderColor: '#ccc', borderWidth: 1, borderRadius: 6, marginVertical: 6 }}>
              <Picker
                selectedValue={formData.selectedClub}
                onValueChange={(value) => handleChange('selectedClub', value)}>
                <Picker.Item label="-- Select Club --" value="" />
                {clubOptions.map((club) => (
                  <Picker.Item key={`club-${club._id}`} label={club.name} value={club._id} />
                ))}
              </Picker>
            </View>
          )}

          {formData.role === 'Club Admin' && (
            <>
              <TextInput style={styles.input} placeholder="Club Name" value={formData.clubName} onChangeText={(val) => handleChange('clubName', val)} />
              <TextInput style={styles.input} placeholder="Club Address" value={formData.clubAddress} onChangeText={(val) => handleChange('clubAddress', val)} />
              <TextInput style={styles.input} placeholder="Club City" value={formData.clubCity} onChangeText={(val) => handleChange('clubCity', val)} />
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>✅ Registration Successful!</Text>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}





const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 20,
    textAlign: 'center'
  },
  formContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6,
      },
      android: { elevation: 5 }
    })
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 8,
    fontSize: 16,
    backgroundColor: 'white'
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937'
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  message: {
    textAlign: 'center',
    color: '#dc2626',
    marginTop: 16,
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 14,
    elevation: 10
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981'
  }
});
