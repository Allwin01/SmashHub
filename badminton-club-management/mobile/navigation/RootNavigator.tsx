import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

const DashboardCoach = () => <View><Text>Coach Dashboard</Text></View>;
const DashboardParent = () => <View><Text>Parent Dashboard</Text></View>;

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={({ route }: any) => {
        const role = route.params?.role;
        if (role === 'Coach') return <DashboardCoach />;
        if (role === 'Parent') return <DashboardParent />;
        return <View><Text>Unknown Role</Text></View>;
      }} />
    </Stack.Navigator>
  );
}