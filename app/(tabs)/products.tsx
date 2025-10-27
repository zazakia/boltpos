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
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/utils/currency';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';

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
  categories?: Category | null;
};

export default function ProductsScreen() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    stock: '',
  });

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        supabase
          .from('products')
          .select('*, categories(*)')
          .order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (productsData.data) setProducts(productsData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category_id: categories[0]?.id || '',
      stock: '0',
    });
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id || '',
      stock: product.stock.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      return;
    }

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        stock: parseInt(formData.stock) || 0,
        active: true,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(productData);

        if (error) throw error;
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', productId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
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
        {isAdmin && (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No products yet</Text>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
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

              {isAdmin && (
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(product)}>
                    <Edit2 size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(product.id)}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter product name"
              />

              <Text style={styles.label}>Price</Text>
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

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
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
});