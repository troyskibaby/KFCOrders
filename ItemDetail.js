// ItemDetail.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'red',
  },
  description: {
    fontSize: 18,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    color: 'green',
  },
  // Add more styles as needed
});

export default ItemDetail;
