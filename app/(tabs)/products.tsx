import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { formatPrice } from '@/utils/currency';
import {
  fetchProducts,
  fetchActiveProducts,
  fetchProductsByIds,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkActivateProducts,
  bulkDeactivateProducts,
  uploadProductImage,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/services/products.service';
import { Plus, Edit2, Trash2, Search, Check, X, Upload, Shield, Lock } from 'lucide-react-native';

type Category = {
  id: string;
  name: string;
  color: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  stock: number;
  active: boolean;
  image_url: string | null;
  categories?: Category | null;
};

// Type for the API response with categories as an array
type ProductWithCategories = {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  stock: number;
  active: boolean;
  image_url: string | null;
  categories?: Category[] | null;
};

export default function ProductsScreen() {
  const { profile } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    stock: '',
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#3B82F6',
  });
  
  // New state for search, filters, and selection
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  
  // Color presets for categories
  const colorPresets = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];

  const canViewProducts = hasPermission(PERMISSIONS.VIEW_PRODUCTS);
  const canCreateProducts = hasPermission(PERMISSIONS.CREATE_PRODUCTS);
  const canEditProducts = hasPermission(PERMISSIONS.EDIT_PRODUCTS);
  const canDeleteProducts = hasPermission(PERMISSIONS.DELETE_PRODUCTS);
  const canManageProducts = hasPermission(PERMISSIONS.EDIT_PRODUCTS) &&
                           hasPermission(PERMISSIONS.DELETE_PRODUCTS);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Only load data if user has permission to view products
      if (!canViewProducts) {
        setLoading(false);
        return;
      }
      
      const productsResult = await fetchProducts();
      
      if (productsResult.error) {
        console.error('Products error:', productsResult.error);
        Alert.alert('Error', 'Failed to load products. Please try again.');
        return;
      }

      if (productsResult.data) {
        // Use the normalized response directly since the service now handles the transformation
        setProducts(productsResult.data);
      }
      
      // Use the service to fetch categories
      const categoriesResult = await fetchCategories();
         
      if (categoriesResult.error) {
        console.error('Categories error:', categoriesResult.error);
        Alert.alert('Error', 'Failed to load categories. Please try again.');
        return;
      }
      
      if (categoriesResult.data) setCategories(categoriesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  // Compute filtered products based on search and active status
  const filteredProducts = products.filter((product) => {
    // Filter by active status based on user permissions
    if (!canManageProducts && !product.active) return false;
    if (canManageProducts && !showInactive && !product.active) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(query);
      const categoryMatch = product.categories?.name.toLowerCase().includes(query);
      return nameMatch || categoryMatch;
    }
    
    return true;
  });

  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category_id: categories[0]?.id || '',
      stock: '0',
    });
    setSelectedImageUri(null);
    setProductModalVisible(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id || '',
      stock: product.stock.toString(),
    });
    setSelectedImageUri(product.image_url);
    setProductModalVisible(true);
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      color: '#3B82F6',
    });
    setCategoryModalVisible(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      color: category.color,
    });
    setCategoryModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to upload product images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProductImageLocal = async (imageUri: string, productId: string): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Use the service function to upload the image
      const result = await uploadProductImage(imageUri, productId);
      
      if (result.error) {
        console.error('Image upload error:', result.error);
        Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
        return null;
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please check your connection.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Check permissions before saving
    if (!editingProduct && !canCreateProducts) {
      Alert.alert('Access Denied', 'You do not have permission to create products');
      return;
    }
    
    if (editingProduct && !canEditProducts) {
      Alert.alert('Access Denied', 'You do not have permission to edit products');
      return;
    }

    try {
      let imageUrl = selectedImageUri;
      
      // For new products, upload image if selected
      if (!editingProduct && selectedImageUri && !selectedImageUri.startsWith('https://')) {
        const tempId = `temp-${Date.now()}`;
        imageUrl = await uploadProductImageLocal(selectedImageUri, tempId);
      }
      
      // For existing products, upload new image if changed
      if (editingProduct && selectedImageUri &&
          selectedImageUri !== editingProduct.image_url &&
          !selectedImageUri.startsWith('https://')) {
        imageUrl = await uploadProductImageLocal(selectedImageUri, editingProduct.id);
      }

      const productData: any = {
        name: formData.name,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        stock: parseInt(formData.stock) || 0,
      };

      // Only set active: true for new products
      if (!editingProduct) {
        productData.active = true;
      }
      
      // Include image_url if we have one
      if (imageUrl) {
        productData.image_url = imageUrl;
      }

      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, productData);

        if (result.error) throw new Error(result.error);
      } else {
        const result = await createProduct(productData);

        if (result.error) throw new Error(result.error);
      }

      setProductModalVisible(false);
      setSelectedImageUri(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Error', error.message || 'Failed to save product');
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const categoryData = {
        name: categoryFormData.name,
        color: categoryFormData.color,
      };

      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, categoryData);

        if (result.error) throw new Error(result.error);
      } else {
        const result = await createCategory(categoryData);

        if (result.error) throw new Error(result.error);
      }

      setCategoryModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving category:', error);
      Alert.alert('Error', error.message || 'Failed to save category');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    // Check permission before showing delete dialog
    if (!canDeleteProducts) {
      Alert.alert('Access Denied', 'You do not have permission to delete products');
      return;
    }
    
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This will mark it as inactive.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteProduct(productId);

              if (result.error) throw new Error(result.error);
              loadData();
            } catch (error: any) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', error.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // Check permission before showing delete dialog
    if (!canEditProducts) {
      Alert.alert('Access Denied', 'You do not have permission to manage categories');
      return;
    }
    
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? This will only delete the category, not the products in it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteCategory(categoryId);

              if (result.error) throw new Error(result.error);
              loadData();
            } catch (error: any) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  // Bulk selection handlers
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedProducts.size === 0) return;
    
    // Check permission for bulk operations
    if (!canManageProducts) {
      Alert.alert('Access Denied', 'You do not have permission for bulk product operations');
      return;
    }
    
    Alert.alert(
      'Activate Products',
      `Are you sure you want to activate ${selectedProducts.size} product(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              const result = await bulkActivateProducts(Array.from(selectedProducts));

              if (result.error) throw new Error(result.error);
              setSelectedProducts(new Set());
              setSelectionMode(false);
              loadData();
            } catch (error: any) {
              console.error('Error activating products:', error);
              Alert.alert('Error', error.message || 'Failed to activate products');
            }
          },
        },
      ]
    );
  };

  const handleBulkDeactivate = async () => {
    if (selectedProducts.size === 0) return;
    
    // Check permission for bulk operations
    if (!canManageProducts) {
      Alert.alert('Access Denied', 'You do not have permission for bulk product operations');
      return;
    }
    
    Alert.alert(
      'Deactivate Products',
      `Are you sure you want to deactivate ${selectedProducts.size} product(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await bulkDeactivateProducts(Array.from(selectedProducts));

              if (result.error) throw new Error(result.error);
              setSelectedProducts(new Set());
              setSelectionMode(false);
              loadData();
            } catch (error: any) {
              console.error('Error deactivating products:', error);
              Alert.alert('Error', error.message || 'Failed to deactivate products');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        {(canEditProducts || canManageProducts) && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addButton} onPress={openAddCategoryModal}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Category</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={openAddProductModal}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {canManageProducts && (
          <View style={styles.filterRow}>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Show Inactive</Text>
              <Switch
                value={showInactive}
                onValueChange={setShowInactive}
                trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                thumbColor={showInactive ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
            <View style={styles.selectionControls}>
              {!selectionMode ? (
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={() => {
                    setSelectionMode(true);
                    setSelectedProducts(new Set());
                  }}>
                  <Text style={styles.selectionButtonText}>Select</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.selectionActive}>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={() => {
                      setSelectionMode(false);
                      setSelectedProducts(new Set());
                    }}>
                    <X size={16} color="#EF4444" />
                    <Text style={[styles.selectionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={selectAllProducts}>
                    <Check size={16} color="#10B981" />
                    <Text style={[styles.selectionButtonText, { color: '#10B981' }]}>
                      {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        {selectionMode && selectedProducts.size > 0 && canManageProducts && (
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkActivate]}
              onPress={handleBulkActivate}>
              <Text style={styles.bulkButtonText}>Activate ({selectedProducts.size})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkDeactivate]}
              onPress={handleBulkDeactivate}>
              <Text style={styles.bulkButtonText}>Deactivate ({selectedProducts.size})</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Categories Section */}
        {canEditProducts && (
          <PermissionGuard permissions={[PERMISSIONS.EDIT_PRODUCTS]} fallback={
            <View style={styles.noDataMessage}>
              <Lock size={32} color="#9CA3AF" />
              <Text style={styles.noDataText}>Category Management</Text>
              <Text style={styles.noDataSubtext}>Contact administrator for category permissions</Text>
            </View>
          }>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
              </View>
              <View style={styles.categoriesList}>
                {categories.map((category) => (
                  <View key={category.id} style={styles.categoryItem}>
                    <View
                      style={[
                        styles.categoryColor,
                        { backgroundColor: category.color },
                      ]}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openEditCategoryModal(category)}>
                        <Edit2 size={18} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteCategory(category.id)}>
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </PermissionGuard>
        )}

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
          </View>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery.trim() ? 'No products found' : 'No products yet'}
              </Text>
              {canCreateProducts && !searchQuery.trim() && (
                <TouchableOpacity style={styles.addButton} onPress={openAddProductModal}>
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Product</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                {canManageProducts && selectionMode && (
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      selectedProducts.has(product.id) && styles.checkboxSelected,
                    ]}
                    onPress={() => toggleProductSelection(product.id)}>
                    {selectedProducts.has(product.id) && (
                      <Check size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                )}
                
                <View style={styles.productInfo}>
                  <View style={styles.productMain}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.categories && (
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: product.categories.color + '20' },
                        ]}>
                        <Text
                          style={[
                            styles.categoryText,
                            { color: product.categories.color },
                          ]}>
                          {product.categories.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                    <Text style={styles.productStock}>Stock: {product.stock}</Text>
                  </View>
                </View>

                {product.image_url && (
                  <Image
                    source={{ uri: product.image_url }}
                    style={styles.productImage}
                  />
                )}

                {!product.active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}

                {canEditProducts && !canManageProducts && !selectionMode && (
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditProductModal(product)}>
                      <Edit2 size={18} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {canDeleteProducts && !canManageProducts && !selectionMode && (
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id)}>
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {canEditProducts && canDeleteProducts && !canManageProducts && !selectionMode && (
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditProductModal(product)}>
                      <Edit2 size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id)}>
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Product Modal */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter product name"
              />

              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryPicker}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      formData.category_id === category.id && styles.categoryOptionSelected,
                      { borderColor: category.color },
                    ]}
                    onPress={() => setFormData({ ...formData, category_id: category.id })}>
                    <Text
                      style={[
                        styles.categoryOptionText,
                        formData.category_id === category.id &&
                          styles.categoryOptionTextSelected,
                      ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                placeholder="0"
                keyboardType="number-pad"
              />

              {/* Image Picker Section */}
              <View style={styles.imagePickerContainer}>
                <Text style={styles.label}>Product Image</Text>
                {selectedImageUri ? (
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={styles.imagePreview}
                  />
                ) : (
                  <View style={[styles.imagePreview, { backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#6B7280', fontSize: 14 }}>No image selected</Text>
                  </View>
                )}
                <View style={styles.imagePickerButtons}>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={handlePickImage}>
                    <Upload size={16} color="#374151" />
                    <Text style={styles.imagePickerButtonText}>
                      {selectedImageUri ? 'Change Image' : 'Pick Image'}
                    </Text>
                  </TouchableOpacity>
                  {selectedImageUri && (
                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={() => setSelectedImageUri(null)}>
                      <X size={16} color="#EF4444" />
                      <Text style={[styles.imagePickerButtonText, { color: '#EF4444' }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setProductModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
                  <Text style={styles.saveButtonText}>
                    {uploadingImage ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Category Name *</Text>
              <TextInput
                style={styles.input}
                value={categoryFormData.name}
                onChangeText={(text) => setCategoryFormData({ ...categoryFormData, name: text })}
                placeholder="Enter category name"
              />

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorPresetsContainer}>
                {colorPresets.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorPreset,
                      categoryFormData.color === color && styles.colorPresetSelected,
                      { backgroundColor: color },
                    ]}
                    onPress={() => setCategoryFormData({ ...categoryFormData, color })}>
                    {categoryFormData.color === color && (
                      <Check size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={categoryFormData.color}
                onChangeText={(text) => setCategoryFormData({ ...categoryFormData, color: text })}
                placeholder="#3B82F6"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setCategoryModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  categoriesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  productStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryOptionTextSelected: {
    color: '#3B82F6',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectionControls: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  selectionActive: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  bulkButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  bulkActivate: {
    backgroundColor: '#D1FAE5',
  },
  bulkDeactivate: {
    backgroundColor: '#FEE2E2',
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  inactiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  colorPresetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  colorPreset: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPresetSelected: {
    borderColor: '#111827',
    borderWidth: 3,
  },
  imagePickerContainer: {
    marginBottom: 16,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  imagePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  imagePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  noDataMessage: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});