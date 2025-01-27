import React from 'react';
import { View, StyleSheet } from 'react-native';

const YellowScreen = () => {
  return (
    <View style={styles.container}>
      {/* Content of the yellow screen */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'yellow',
  },
});

export default YellowScreen;
