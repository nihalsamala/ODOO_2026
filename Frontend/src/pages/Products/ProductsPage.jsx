import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Layers, Check, X, Package } from 'lucide-react';
import productService from '../../services/productService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ProductModal from './ProductModal';
import ProductPlansModal from './ProductPlansModal';

export function ProductsPage() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [compatModalProduct, setCompatModalProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    setSubmitting(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        showToast(`Product "${formData.name}" updated successfully.`, 'success');
      } else {
        await productService.createProduct(formData);
        showToast(`Product "${formData.name}" created successfully.`, 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{row.name}</div>
          {row.notes && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {row.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      width: '120px',
      render: (row) => (
        <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
          {row.type}
        </span>
      ),
    },
    {
      header: 'Sales Price',
      accessor: 'salesPrice',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(row.salesPrice)}</span>
      ),
    },
    {
      header: 'Cost Price',
      accessor: 'costPrice',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(row.costPrice)}</span>
      ),
    },
    {
      header: 'Variants',
      accessor: 'variants',
      render: (row) => {
        const count = row.variants?.length || 0;
        if (count === 0) {
          return <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>None (Base)</span>;
        }
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {row.variants.slice(0, 2).map((v) => (
              <span
                key={v.id}
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {v.name} (+₹{v.priceAdjustment})
              </span>
            ))}
            {count > 2 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                +{count - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'active',
      width: '110px',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'neutral'}>
          {row.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      width: '200px',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Layers}
            onClick={(e) => {
              e.stopPropagation();
              setCompatModalProduct(row);
            }}
          >
            Plans
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Product Catalog</h1>
          <p className="page-header-subtitle">
            Configure billable products, service tiers, and pricing adjustments for variants.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            New Product
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Search products by name or notes..."
        searchFields={['name', 'type', 'notes']}
        emptyTitle="No products found"
        emptyDescription="Create your first billable product to start defining subscription plans."
      />

      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        loading={submitting}
      />

      {compatModalProduct && (
        <ProductPlansModal
          isOpen={Boolean(compatModalProduct)}
          onClose={() => setCompatModalProduct(null)}
          product={compatModalProduct}
          onSaved={fetchProducts}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default ProductsPage;
