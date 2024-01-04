import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample JSON menu data
import menuData from './menuData.json';

const Stack = createStackNavigator();

const App = () => {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Menu">
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{
            title: 'KFC Menu',
            headerRight: MyOrdersButton,
          }}
        />
        <Stack.Screen name="Details" component={ItemDetail} />
        <Stack.Screen name="Order" component={ViewOrder} />
        <Stack.Screen name="OrderHistory" component={ViewOrderHistory} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const MyOrdersButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
        style={styles.orderHistoryButton}
        onPress={() => navigation.navigate('OrderHistory')}
      >
        <Text style={styles.orderHistoryButtonText}>My Orders</Text>
      </TouchableOpacity>
  );
};

const MenuScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [order, setOrder] = useState([]);
  const navigation = useNavigation();

  const filterMenuItems = () => {
    let filteredItems = menuData.reduce((acc, category) => {
      const filteredCategoryItems = category.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredCategoryItems.length > 0) {
        acc.push({
          ...category,
          items: filteredCategoryItems
        });
      }

      return acc;
    }, []);

    if (selectedCategory && selectedCategory !== 'All Items') {
      filteredItems = filteredItems.filter(category =>
        category.category === selectedCategory
      );
    }

    return filteredItems;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>KFC Menu</Text>
       
      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search items"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Category filter */}
      <View style={styles.categoryFilter}>
        <FlatList
          horizontal
          data={['All Items', ...menuData.map(category => category.category)]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryOption,
                selectedCategory === item
                  ? styles.selectedCategory
                  : styles.unselectedCategory
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Display filtered items */}
      <FlatList
  data={filterMenuItems()}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={styles.menuItem}>
      <Text style={styles.itemTitle}>{item.category}</Text>
      <FlatList
        data={item.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Details', { item, order, setOrder })}
          >
            <View style={styles.subItem}>
              <Text style={styles.subItemTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
              <Text style={styles.subItemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )}
/>
      {/* View Orders Button */}
      <TouchableOpacity
        style={styles.viewOrderButton}
        onPress={() => navigation.navigate('Order', { order: order, setOrder })}
      >
        <Text style={styles.viewOrderButtonText}>
          View Order ({order.length} {order.length === 1 ? 'item' : 'items'})
        </Text>
      </TouchableOpacity>

      
    </View>
  );
};

const ItemDetail = ({ route, navigation }) => {
  const { item, order, setOrder} = route.params;

  const handleAddToOrder = () => {
    setOrder([...order, item]);
    console.log(`Added ${item.title} to the order`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      <TouchableOpacity
        style={styles.addToOrderButton}
        onPress={handleAddToOrder}
      >
        <Text style={styles.addToOrderButtonText}>Add to Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const ViewOrder = ({ route }) => {
  const { params } = route;
  const setOrder = params ? params.setOrder : () => {};
  const order = params ? params.order : [];
  const [refreshList, setRefreshList] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const navigation = useNavigation();  // Add this line to get the navigation object

  const removeFromOrder = (itemId) => {
    const updatedOrder = order.filter((item) => item.id !== itemId);
    setOrder(updatedOrder);
  };

  const saveOrderInHistory = async (order) => {
    try {
      const currentDate = new Date();
      Alert.alert('Order Submitted', 'Thank you for your order!');
      const orderHistory = await AsyncStorage.getItem('orderHistory');
      const parsedOrderHistory = orderHistory ? JSON.parse(orderHistory) : [];

      const newOrderEntry = {
        date: currentDate.toLocaleDateString(),
        time: currentDate.toLocaleTimeString(),
        order,
      };

      parsedOrderHistory.push(newOrderEntry);

      await AsyncStorage.setItem('orderHistory', JSON.stringify(parsedOrderHistory));

      setOrder([]);
      navigation.navigate('Menu');
    } catch (error) {
      console.error('Error saving order in history:', error);
    }
  };

  

  useEffect(() => {
    setRefreshList(true);

    const sum = order.reduce((acc, item) => acc + item.price, 0);
    setTotalPrice(sum);

    return () => setRefreshList(false);
  }, [order]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Order</Text>

      {order.length === 0 ? (
        <Text style={styles.emptyOrderText}>Your order is empty</Text>
      ) : (
        <>
          <FlatList
            data={order}
            keyExtractor={(item) => item.id}
            extraData={refreshList}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <Text style={styles.orderItemTitle}>{item.title}</Text>
                <Text style={styles.orderItemPrice}>${item.price.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromOrder(item.id)}>
                  <Image
                    source={require('./trash-icon.png')}
                    style={styles.trashIcon}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.submitOrderButton}
            onPress={() =>  saveOrderInHistory(order)}
          >
            <Text style={styles.submitOrderButtonText}>Submit Order</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const ViewOrderHistory = () => {
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const storedOrderHistory = await AsyncStorage.getItem('orderHistory');
        if (storedOrderHistory) {
          const parsedOrderHistory = JSON.parse(storedOrderHistory);
          setOrderHistory(parsedOrderHistory);
        }
      } catch (error) {
        console.error('Error fetching order history:', error);
      }
    };

    fetchOrderHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order History</Text>

      {orderHistory.length === 0 ? (
        <Text style={styles.emptyOrderText}>No order history available</Text>
      ) : (
        <FlatList
          data={orderHistory}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item }) => (
            <View style={styles.orderHistoryContainer}>
              <Text style={styles.orderHistoryDate}>{`Date: ${item.date}`}</Text>
              <Text style={styles.orderHistoryTime}>{`Time: ${item.time}`}</Text>
              <FlatList
                data={item.order}
                keyExtractor={(orderItem) => orderItem.id}
                renderItem={({ item: orderItem }) => (
                  <View style={styles.orderHistoryDetail}>
                    <Text style={styles.orderHistoryTitle}>{orderItem.title}</Text>
                    <Text style={styles.orderHistoryPrice}>{`$${orderItem.price.toFixed(2)}`}</Text>
                  </View>
                )}
              />
              <View style={styles.orderHistoryTotalContainer}>
                <Text style={styles.orderHistoryTotalText}>Total:</Text>
                <Text style={styles.orderHistoryTotalPrice}>{`$${item.order.reduce((acc, orderItem) => acc + orderItem.price, 0).toFixed(2)}`}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  categoryFilter: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryOption: {
    paddingHorizontal: 12,
    marginRight: 10,
    color: 'white',
    borderRadius: 5,
    paddingVertical: 5,
  },
  selectedCategory: {
    backgroundColor: 'red',
    fontWeight: 'bold',
    color: 'white'
  },
  unselectedCategory: {
    backgroundColor: 'white',
    color: 'red',
  },
  menuItem: {
    marginBottom: 20,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subItem: {
    marginBottom: 8,
  },
  subItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subItemPrice: {
    color: 'green',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'black',
  },
  description: {
    fontSize: 18,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    color: 'green',
  },
  addToOrderButton: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    bottom: -20,
    left: 0,
    right: 0,
  },
  addToOrderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewOrderButton: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  viewOrderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyOrderText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },

  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },

  orderItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  orderItemPrice: {
    fontSize: 16,
    color: 'green',
  },

  submitOrderButton: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },

  submitOrderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 18,
    color: 'green',
  },
  trashIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginLeft: 10,
  },
  orderHistoryContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    paddingBottom: 10,
  },

  orderHistoryDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  orderHistoryTime: {
    fontSize: 16,
    marginBottom: 8,
  },

  orderHistoryDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },

  orderHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  orderHistoryPrice: {
    fontSize: 16,
    color: 'green',
  },
  orderHistoryTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  orderHistoryTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  orderHistoryTotalPrice: {
    fontSize: 16,
    color: 'green',
  },
  orderHistoryButton: {
    backgroundColor: 'red', // Set background color to red
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20, // Set border radius for pill shape
    marginVertical: 10,
  },
  orderHistoryButtonText: {
    color: 'white', // Set text color to white
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
});

export default App;

