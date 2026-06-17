import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.log('safeJsonParse error in BookOrderScreen:', err);
    return fallback;
  }
};

const PRODUCT_LIST = [
  { name: 'Paracetamol 650mg', defaultRate: 15.00 },
  { name: 'Augmentin 625 Duo', defaultRate: 120.00 },
  { name: 'Calpol 500mg', defaultRate: 12.00 },
  { name: 'Azithromycin 500mg', defaultRate: 85.00 },
  { name: 'Pan-D Capsule', defaultRate: 45.00 },
  { name: 'Limcee Vitamin C', defaultRate: 8.00 }
];

const CUSTOMER_MASTERS: Record<string, Array<{ name: string; mobile: string; due: number }>> = {
  Doctor: [
    { name: 'Dr. Ramesh (Cardiologist)', mobile: '9876543210', due: 0 },
    { name: 'Dr. Kumar (Pediatrician)', mobile: '8765432109', due: 0 },
    { name: 'Dr. Anitha (Dermatologist)', mobile: '7654321098', due: 0 },
    { name: 'Dr. Suresh (General Physician)', mobile: '6543210987', due: 0 }
  ],
  Chemist: [
    { name: 'Apollo Pharmacy', mobile: '9988776655', due: 5000 },
    { name: 'MedPlus Drugs', mobile: '8877665544', due: 3500 },
    { name: 'Sri Rama Medicals', mobile: '7766554433', due: 7200 },
    { name: 'Care Chemists', mobile: '6655443322', due: 1800 }
  ],
  Hospital: [
    { name: 'Yashoda Hospital', mobile: '9123456789', due: 15000 },
    { name: 'Apollo Hospitals', mobile: '9234567890', due: 28000 },
    { name: 'Care Hospital', mobile: '9345678901', due: 12500 },
    { name: 'Sunshine Clinic', mobile: '9456789012', due: 4500 }
  ]
};

const BookOrderScreen = () => {
  const [customerType, setCustomerType] = useState('Chemist');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_LIST[0].name);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState(PRODUCT_LIST[0].defaultRate.toString());
  const [totalAmount, setTotalAmount] = useState('0');
  const [distributor, setDistributor] = useState('');
  const [remarks, setRemarks] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Editing and Loading states
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Web safe alert
  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Simulate API fetch delay on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingMaster(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto pre-fill default rate when product changes
  useEffect(() => {
    const prod = PRODUCT_LIST.find(p => p.name === selectedProduct);
    if (prod) {
      setRate(prod.defaultRate.toFixed(2));
    }
  }, [selectedProduct]);

  // Reset selected customer name/mobile when type changes
  useEffect(() => {
    setCustomerName('');
    setCustomerMobile('');
  }, [customerType]);

  // Auto calculate total amount
  useEffect(() => {
    const qtyVal = parseFloat(quantity) || 0;
    const rateVal = parseFloat(rate) || 0;
    setTotalAmount((qtyVal * rateVal).toFixed(2));
  }, [quantity, rate]);

  // Load orders from local storage on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setError(null);
    try {
      const storedOrders = await AsyncStorage.getItem('@orders');
      const parsed = safeJsonParse(storedOrders, []);
      setOrders(parsed);
    } catch (err) {
      console.log('Failed to load orders:', err);
      setError('Failed to load order history from storage.');
    }
  };

  const formatOrderDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      customAlert('Error', 'Please enter or select customer name');
      return;
    }
    if (!customerMobile.trim() || customerMobile.length !== 10) {
      customAlert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!quantity.trim() || parseFloat(quantity) <= 0) {
      customAlert('Error', 'Please enter a valid quantity');
      return;
    }
    if (!rate.trim() || parseFloat(rate) <= 0) {
      customAlert('Error', 'Please enter a valid rate');
      return;
    }

    if (editingOrderId !== null) {
      // Update existing order
      const updatedOrders = orders.map(o => {
        if (o.id === editingOrderId) {
          return {
            ...o,
            customerType,
            customerName,
            customerMobile,
            productName: selectedProduct,
            quantity: parseFloat(quantity),
            rate: parseFloat(rate),
            totalAmount: parseFloat(totalAmount),
            distributor,
            remarks,
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      try {
        await AsyncStorage.setItem('@orders', JSON.stringify(updatedOrders));
        customAlert('✅ Order Updated!', `Order details updated successfully.`);
        
        // Reset editing state
        setEditingOrderId(null);
        setCustomerName('');
        setCustomerMobile('');
        setQuantity('');
        setRemarks('');
      } catch (error) {
        customAlert('Error', 'Failed to update order locally.');
      }
    } else {
      // Create new order
      const nextOrderNum = 1000 + orders.length + 1;
      const orderNumber = `ORD-${nextOrderNum}`;

      const newOrder = {
        id: Date.now(),
        orderNumber,
        customerType,
        customerName,
        customerMobile,
        productName: selectedProduct,
        quantity: parseFloat(quantity),
        rate: parseFloat(rate),
        totalAmount: parseFloat(totalAmount),
        distributor,
        remarks,
        status: 'Booked', // Booked, Forwarded, Delivered, Cancelled
        dateFormatted: formatOrderDate(new Date()),
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);

      try {
        await AsyncStorage.setItem('@orders', JSON.stringify(updatedOrders));
        customAlert('✅ Order Booked!', `Order ${orderNumber} has been successfully recorded.`);
        
        // Reset inputs
        setCustomerName('');
        setCustomerMobile('');
        setQuantity('');
        setRemarks('');
      } catch (error) {
        customAlert('Error', 'Failed to save order data locally.');
      }
    }
  };

  const handleEditOrder = (order: any) => {
    setEditingOrderId(order.id);
    setCustomerType(order.customerType);
    setCustomerName(order.customerName);
    setCustomerMobile(order.customerMobile);
    setSelectedProduct(order.productName);
    setQuantity(order.quantity.toString());
    setRate(order.rate.toString());
    setDistributor(order.distributor || '');
    setRemarks(order.remarks);
    
    customAlert('Editing Order', `Modifying order ${order.orderNumber}. Adjust fields at the top of the form.`);
  };

  const handleCancelOrder = async (orderId: number) => {
    const confirmCancel = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to cancel this order?')
      : true;

    if (Platform.OS === 'web') {
      if (confirmCancel) {
        const updatedOrders = orders.map(o => {
          if (o.id === orderId) {
            return { ...o, status: 'Cancelled' };
          }
          return o;
        });
        setOrders(updatedOrders);
        try {
          await AsyncStorage.setItem('@orders', JSON.stringify(updatedOrders));
          customAlert('Success', 'Order cancelled successfully.');
        } catch (e) {
          console.log('Failed to cancel order:', e);
        }
      }
    } else {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: async () => {
              const updatedOrders = orders.map(o => {
                if (o.id === orderId) {
                  return { ...o, status: 'Cancelled' };
                }
                return o;
              });
              setOrders(updatedOrders);
              try {
                await AsyncStorage.setItem('@orders', JSON.stringify(updatedOrders));
                customAlert('Success', 'Order cancelled successfully.');
              } catch (e) {
                console.log('Failed to cancel order:', e);
              }
            }
          }
        ]
      );
    }
  };

  // Tapping the status badge cycles status (Pending -> Approved -> Delivered -> Cancelled)
  const cycleStatus = async (orderId: number) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        let nextStatus = 'Booked';
        if (order.status === 'Booked' || order.status === 'Pending') nextStatus = 'Forwarded';
        else if (order.status === 'Forwarded' || order.status === 'Approved') nextStatus = 'Delivered';
        else if (order.status === 'Delivered') nextStatus = 'Cancelled';
        else nextStatus = 'Booked';
        return { ...order, status: nextStatus };
      }
      return order;
    });

    setOrders(updatedOrders);
    try {
      await AsyncStorage.setItem('@orders', JSON.stringify(updatedOrders));
    } catch (e) {
      console.log('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'Delivered': return { bg: '#E3F2FD', text: '#1565C0' };
      case 'Cancelled': return { bg: '#FFEBEE', text: '#C62828' };
      default: return { bg: '#FFF3E0', text: '#E65100' };
    }
  };

  // Filter history by search box
  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const orderNo = order.orderNumber || '';
    const custName = order.customerName || '';
    const prodName = order.productName || '';
    return (
      orderNo.toLowerCase().includes(searchLower) ||
      custName.toLowerCase().includes(searchLower) ||
      prodName.toLowerCase().includes(searchLower)
    );
  });

    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 280 }}
          keyboardShouldPersistTaps="handled"
        >


      <Text style={styles.title}>📦 Book Order</Text>

      {loadingMaster ? (
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loaderText}>Syncing product & customer registries...</Text>
        </View>
      ) : (
        <View style={styles.form}>
          {editingOrderId !== null && (
            <View style={styles.editBanner}>
              <Text style={styles.editBannerText}>✏️ Editing Order {orders.find(o=>o.id===editingOrderId)?.orderNumber}</Text>
            </View>
          )}

          {/* Customer Type Selector */}
          <Text style={styles.label}>Customer Type *</Text>
          <View style={styles.selectorRow}>
            {['Chemist', 'Hospital', 'Stockist'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setCustomerType(type)}
                style={[
                  styles.selectorButton,
                  customerType === type && styles.selectorActive,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    customerType === type && styles.selectorTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Customer Dropdown Master List */}
          <Text style={styles.label}>Select Predefined Customer *</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}
          >
            <Text style={styles.dropdownTriggerText}>
              {customerName ? customerName : `-- Choose ${customerType} from Database --`}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showCustomerDropdown && (
            <View style={styles.dropdownContainer}>
              {CUSTOMER_MASTERS[customerType].map((cust) => (
                <TouchableOpacity
                  key={cust.name}
                  style={[
                    styles.dropdownOption,
                    customerName === cust.name && styles.dropdownOptionActive
                  ]}
                  onPress={() => {
                    setCustomerName(cust.name);
                    setCustomerMobile(cust.mobile);
                    setCustomerMobile(cust.mobile);
                    setShowCustomerDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    customerName === cust.name && styles.dropdownOptionTextActive
                  ]}>
                    👤 {cust.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Customer Name (Editable) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Name will autofill, or type custom"
            value={customerName}
            onChangeText={setCustomerName}
          />
{/* 
          <Text style={styles.label}>Customer Mobile (Editable) *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit number will autofill, or type custom"
            value={customerMobile}
            onChangeText={setCustomerMobile}
            keyboardType="numeric"
            maxLength={10}
          /> */}
          <Text style={styles.label}>Customer Mobile (Editable) *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit number will autofill, or type custom"
            value={customerMobile}
            onChangeText={(text) => setCustomerMobile(text.replace(/[^0-9]/g, ''))} // Strips letters/spaces
            keyboardType="numeric"
            maxLength={10}
          />
          {/* Product Dropdown Selector */}
          <Text style={styles.label}>Product Name *</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setShowProductDropdown(!showProductDropdown)}
          >
            <Text style={styles.dropdownTriggerText}>{selectedProduct}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showProductDropdown && (
            <View style={styles.dropdownContainer}>
              {PRODUCT_LIST.map((prod) => (
                <TouchableOpacity
                  key={prod.name}
                  style={[
                    styles.dropdownOption,
                    selectedProduct === prod.name && styles.dropdownOptionActive
                  ]}
                  onPress={() => {
                    setSelectedProduct(prod.name);
                    setShowProductDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedProduct === prod.name && styles.dropdownOptionTextActive
                  ]}>
                    💊 {prod.name} (₹{prod.defaultRate.toFixed(2)} / unit)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Rate (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15.00"
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Forward To Distributor</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Metro Pharma"
            value={distributor}
            onChangeText={setDistributor}
          />

          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional remarks..."
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 150);
            }}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.submitButton, editingOrderId !== null && { flex: 2 }]} 
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>
                {editingOrderId !== null ? 'UPDATE ORDER' : 'SUBMIT ORDER'}
              </Text>
            </TouchableOpacity>
            {editingOrderId !== null && (
              <TouchableOpacity 
                style={styles.cancelEditButton} 
                onPress={() => {
                  setEditingOrderId(null);
                  setCustomerName('');
                  setCustomerMobile('');
                  setQuantity('');
                  setRemarks('');
                }}
              >
                <Text style={styles.cancelEditText}>CANCEL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* History and Search */}
      {!loadingMaster && (
        <>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
                <Text style={styles.retryButtonText}>🔄 Retry Loading History</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.historyTitle}>Booked Orders History ({filteredOrders.length})</Text>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="🔍 Search orders by number, customer, or product..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const statusStyle = getStatusColor(order.status);
                  return (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View>
                          <Text style={styles.orderNumberText}>{order.orderNumber || 'ORD-Legacy'}</Text>
                          <Text style={styles.orderName}>{order.customerName || 'N/A'}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => cycleStatus(order.id)}
                          style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
                        >
                          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                            {(order.status || 'Pending')} 🔄
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={styles.orderInfo}>📱 Mobile: {order.customerMobile || 'N/A'}</Text>
                      <Text style={styles.orderInfo}>💊 Product: {order.productName || 'N/A'} ({order.quantity || 0} x ₹{order.rate || 0})</Text>
                      <Text style={styles.orderInfo}>📅 Date: {order.dateFormatted || order.date || 'N/A'}</Text>
                      {order.remarks ? (
                        <Text style={styles.orderInfo}>💬 Remarks: {order.remarks}</Text>
                      ) : null}
                      
                      <View style={styles.cardDivider} />
                      
                      <View style={styles.cardTotalRow}>
                        <View>
                          <Text style={styles.dueBreakdownText}>Fwd To: {order.distributor || 'Not Assigned'}</Text>
                        </View>
                        <Text style={styles.orderTotal}>Net: ₹{(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
                      </View>

                      {/* Edit and Cancel buttons for Booked orders */}
                      {order.status === 'Booked' && (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity 
                            onPress={() => handleEditOrder(order)}
                            style={[styles.actionButtonItem, styles.editBtn]}
                          >
                            <Text style={styles.actionButtonText}>✏️ Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleCancelOrder(order.id)}
                            style={[styles.actionButtonItem, styles.cancelBtn]}
                          >
                            <Text style={styles.actionButtonText}>❌ Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No orders found matching your search</Text>
                </View>
              )}
            </>
          )}
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
     </KeyboardAvoidingView> 
  );
};

export default BookOrderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  loaderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
  },
  editBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  editBannerText: {
    fontSize: 13,
    color: '#0D47A1',
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  selectorButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  selectorActive: {
    backgroundColor: '#1E88E5',
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  selectorTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    marginBottom: 4,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: -2,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionActive: {
    backgroundColor: '#E3F2FD',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#555',
  },
  dropdownOptionTextActive: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  dueCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 18,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dueLabel: {
    fontSize: 12,
    color: '#1565C0',
  },
  dueValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D47A1',
  },
  dueTotalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
    paddingTop: 8,
  },
  dueTotalLabel: {
    fontSize: 13,
    color: '#0D47A1',
    fontWeight: 'bold',
  },
  dueTotalValue: {
    fontSize: 15,
    color: '#0D47A1',
    fontWeight: 'bold',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#1E88E5',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelEditButton: {
    flex: 1,
    backgroundColor: '#757575',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  clearSearchButton: {
    padding: 5,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  orderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderInfo: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  cardTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dueBreakdownText: {
    fontSize: 11,
    color: '#888',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButtonItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editBtn: {
    backgroundColor: '#E3F2FD',
  },
  cancelBtn: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 15,
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#C62828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
