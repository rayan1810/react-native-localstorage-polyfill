import { StyleSheet, View, Text } from 'react-native';

export default function App() {
  localStorage.setItem('key', '1');

  return (
    <View style={styles.container}>
      <Text>Key Stored in Local Storage: {localStorage.getItem('key')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
