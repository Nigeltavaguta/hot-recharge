import { Tabs } from 'expo-router/js-tabs';

import { Icon, type IconName } from '@/components/Icon';
import { TabBar } from '@/components/TabBar';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'tokens', title: 'Tokens', icon: 'tokens' },
  { name: 'activity', title: 'Activity', icon: 'activity' },
  { name: 'profile', title: 'Profile', icon: 'profile' },
];

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => <Icon name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
