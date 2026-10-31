import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, Layers, Tag, Info, ShoppingCart } from 'lucide-react';
import productService from '../../services/productService';
import planService from '../../services/planService';
import { formatCurrency, formatInterval } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SubscribeModal from './SubscribeModal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's date as "YYYY-MM-DD" using LOCAL time so comparisons
 * against the backend's LocalDate strings are timezone-safe in IST.
 */
function localDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// ProductCard — internal component
// ---------------------------------------------------------------------------

const TYPE_BADGE_VARIANT = {
  SERVICE: 'info',
  DIGITAL: 'purple',
  PHYSICAL: 'neutral',
};

function ProductCard({ product, onSubscribe, isCustomer, isAuthenticated }) {
  const { name, type, salesPrice, notes, activeVariants, compatiblePlans } = product;
  const typeVariant = TYPE_BADGE_VARIANT[type] || 'neutral';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <div className="card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
              flexWrap: 'wrap',
            }}
          >
            <Badge variant={typeVariant}>{type}</Badge>
            <Badge variant="success">Active</Badge>
          </div>
          <div
            className="card-title"
            style={{ wordBreak: 'break-word', lineHeight: 1.35 }}
          >
            {name}
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Package size={20} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="card-body" style={{ flex: 1 }}>

        {/* Description / notes */}
        {notes && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.65,
              marginBottom: '16px',
            }}
          >
            {notes}
          </p>
        )}

        {/* Base price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <Tag
            size={14}
            style={{ color: 'var(--color-text-subtle)', flexShrink: 0 }}
            aria-hidden="true"
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Base price:
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: '1.05rem',
              color: 'var(--color-text-main)',
            }}
          >
            {formatCurrency(salesPrice)}
          </span>
        </div>

        {/* Active variants */}
        {activeVariants && activeVariants.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-text-muted)',
                marginBottom: '8px',
              }}
            >
              Variants
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {activeVariants.map((variant) => (
                <div
                  key={variant.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-text-main)' }}>
                    {variant.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                    }}
                  >
                    {formatCurrency(variant.effectivePrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compatible subscription plans */}
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-muted)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Layers size={13} aria-hidden="true" />
            Subscription Plans
          </div>

          {compatiblePlans.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                color: 'var(--color-text-subtle)',
                fontStyle: 'italic',
                padding: '6px 0',
              }}
            >
              <Info size={14} aria-hidden="true" />
              No plans currently available for this product.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {compatiblePlans.map((mapping) => {
                const minQty = mapping.planDetails?.minimumQuantity ?? 1;
                return (
                  <div
                    key={mapping.planId}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-primary-border)',
                      backgroundColor: 'var(--color-primary-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      {/* Plan name + min qty */}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: 'var(--color-text-main)',
                            wordBreak: 'break-word',
                          }}
                        >
                          {mapping.name}
                        </div>
                        {minQty > 1 && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--color-text-muted)',
                              marginTop: '2px',
                            }}
                          >
                            Min. quantity: {minQty}
                          </div>
                        )}
                      </div>

                      {/* Price + billing interval */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {formatCurrency(mapping.price)}
                        </div>
                        <span
                          className="badge badge-info"
                          style={{ fontSize: '0.68rem', marginTop: '3px' }}
                        >
                          {formatInterval(mapping.billingInterval)}
                        </span>
                      </div>
                    </div>

                    {/* Subscribe Action */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        paddingTop: '6px',
                        borderTop: '1px dashed var(--color-primary-border)',
                      }}
                    >
                      {isCustomer ? (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={ShoppingCart}
                          onClick={() => onSubscribe(product, mapping)}
                        >
                          Subscribe
                        </Button>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--color-text-subtle)',
                            fontStyle: 'italic',
                          }}
                        >
                          {isAuthenticated ? 'Customer role required' : 'Sign in as customer'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="card-footer" style={{ justifyContent: 'flex-start' }}>
        <span
          style={{
            fontSize: '0.775rem',
            color: 'var(--color-text-subtle)',
            fontStyle: 'italic',
          }}
        >
          {isCustomer
            ? 'Select a plan above to subscribe and generate your billing agreement.'
            : 'Administrative catalog view. Customer accounts purchase via catalog.'}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CatalogPage
// ---------------------------------------------------------------------------

export function CatalogPage() {
  const { showToast } = useToast();
  const { isCustomer, isAuthenticated } = useAuth();

  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null); // { product, plan }
  /**
   * Incrementing retryCount re-triggers the useEffect without needing
   * a memoised fetch function in the dependency array.
   */
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setError(null);

      try {
        // ── Step 1: fetch active products + active plans in parallel ─────────
        //   productService.getProducts(true) → GET /api/products?activeOnly=true
        //     Returns ProductResponse[] with variants[] embedded.
        //   planService.getPlans(true)       → GET /api/plans?activeOnly=true
        //     Returns normalised PlanResponse[] with both raw and aliased keys.
        const [products, activePlans] = await Promise.all([
          productService.getProducts(true),
          planService.getPlans(true),
        ]);

        // ── Step 2: build O(1) active-plan lookup map ────────────────────────
        //   Only plans already confirmed active (returned above) go in the map.
        const activePlanMap = new Map(activePlans.map((p) => [p.id, p]));

        // ── Step 3: fetch per-product plan mappings in parallel ──────────────
        //   getProductPlans(id) internally calls GET /api/product-plans,
        //   then filters: productId match AND mapping.active !== false.
        //   It returns: { id(=planId), mappingId, planId, name, billingInterval, price }
        const mappingsPerProduct = await Promise.all(
          products.map((p) => productService.getProductPlans(p.id))
        );

        // ── Step 4: apply remaining filters and enrich ───────────────────────
        const today = localDateString(); // "YYYY-MM-DD" in local time

        const items = products.map((product, idx) => {
          const rawMappings = mappingsPerProduct[idx] || [];

          const compatiblePlans = rawMappings
            .filter((mapping) => {
              // (a) mapping.active already enforced by getProductPlans().
              // (b) Plan must exist in activePlanMap (i.e., plan.active === true).
              const plan = activePlanMap.get(mapping.planId);
              if (!plan) return false;

              // (c) Today must be within the plan's availability window.
              //     planService normalises both key names; handle either.
              const start = plan.availabilityStartDate || plan.availableFrom;
              const end   = plan.availabilityEndDate   || plan.availableTo;

              // ISO date string comparison is lexicographically correct.
              if (start && today < start) return false; // not yet available
              if (end   && today > end)   return false; // expired

              return true;
            })
            .map((mapping) => ({
              ...mapping,
              // Attach full plan object so the card can read minimumQuantity etc.
              planDetails: activePlanMap.get(mapping.planId),
            }));

          // Variants are already embedded in ProductResponse; show only active ones.
          const activeVariants = (product.variants || []).filter((v) => v.active);

          return { ...product, compatiblePlans, activeVariants };
        });

        if (!cancelled) setCatalogItems(items);
      } catch (err) {
        if (!cancelled) {
          const msg = err.message || 'Failed to load the product catalog.';
          setError(msg);
          showToast(msg, 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalog();

    // Discard stale results if the component unmounts or a retry starts.
    return () => {
      cancelled = true;
    };
  }, [retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => setRetryCount((c) => c + 1);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header is always visible */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Product Catalog</h1>
          <p className="page-header-subtitle">
            Browse our active products and available subscription plans.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading catalog…" size={32} />
      ) : error ? (
        <EmptyState
          icon={ShoppingBag}
          title="Could not load catalog"
          description={error}
          actionLabel="Retry"
          onAction={handleRetry}
        />
      ) : catalogItems.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No products available"
          description="There are no active products in the catalog at this time. Check back later."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {catalogItems.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSubscribe={(prod, plan) => setSelectedPurchase({ product: prod, plan })}
              isCustomer={isCustomer}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      {selectedPurchase && (
        <SubscribeModal
          isOpen={Boolean(selectedPurchase)}
          onClose={() => setSelectedPurchase(null)}
          product={selectedPurchase.product}
          plan={selectedPurchase.plan}
          onSuccess={() => {
            // Subscription created successfully
          }}
        />
      )}
    </div>
  );
}

export default CatalogPage;
