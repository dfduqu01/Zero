# localStorage Cart Specification

**Version**: 1.0
**Date**: November 4, 2025
**Status**: Active

---

## Overview

This document specifies how the shopping cart is managed in browser localStorage for unauthenticated users, and how it transfers to the database upon registration/login.

### Key Principles

1. **Browse Freely**: Users can browse and add items to cart without logging in
2. **localStorage Storage**: Cart data stored client-side until registration
3. **Seamless Transfer**: Cart automatically moves to database on authentication
4. **No Data Loss**: Cart preserved across page reloads and browser sessions
5. **Privacy**: Prescription images compressed/encoded before localStorage storage

---

## Data Structure

### TypeScript Interfaces

```typescript
interface LocalStorageCart {
  version: string; // Schema version (e.g., "1.0")
  items: CartItem[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  expiresAt: string; // ISO 8601 timestamp (30 days from creation)
}

interface CartItem {
  id: string; // Temporary UUID for local tracking
  productId: string; // UUID from database
  quantity: number;
  prescription?: PrescriptionData;
  treatments: string[]; // Array of treatment UUIDs
  addedAt: string; // ISO 8601 timestamp
}

interface PrescriptionData {
  hasPrescription: boolean;
  // Right Eye (OD)
  odSph?: number; // -20.00 to +20.00
  odCyl?: number; // -4.00 to +4.00
  odAxis?: number; // 0-180
  // Left Eye (OS)
  osSph?: number;
  osCyl?: number;
  osAxis?: number;
  // Pupillary Distance
  pd?: number; // 20.0-80.0 (single PD)
  pdDualOd?: number; // Dual PD right eye
  pdDualOs?: number; // Dual PD left eye
  // Additional
  addValue?: number; // For progressive lenses
  prescriptionImageBase64?: string; // Compressed image as base64
}
```

### localStorage Key

```typescript
const CART_STORAGE_KEY = 'zero_cart';
```

---

## Size Limitations

### localStorage Limits
- **Total Storage**: ~5-10 MB (browser dependent)
- **Per Item**: Target ~100 KB max
- **Total Cart**: Target ~2 MB max

### Item Limits
- **Maximum Items**: 50 items per cart
- **Maximum Prescription Images**: Compress to < 500 KB each
- **Image Format**: Convert to WebP/JPEG, compress to 80% quality

### Validation
```typescript
const LIMITS = {
  MAX_ITEMS: 50,
  MAX_CART_SIZE_MB: 2,
  MAX_IMAGE_SIZE_KB: 500,
  CART_EXPIRY_DAYS: 30
};
```

---

## Cart Operations

### 1. Initialize Cart

```typescript
function initializeCart(): LocalStorageCart {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const cart: LocalStorageCart = {
    version: '1.0',
    items: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  return cart;
}
```

### 2. Load Cart

```typescript
function loadCart(): LocalStorageCart | null {
  try {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartJson) return null;

    const cart: LocalStorageCart = JSON.parse(cartJson);

    // Check expiry
    if (new Date(cart.expiresAt) < new Date()) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return null;
    }

    // Migrate version if needed
    if (cart.version !== '1.0') {
      return migrateCart(cart);
    }

    return cart;
  } catch (error) {
    console.error('Failed to load cart:', error);
    return null;
  }
}
```

### 3. Add Item to Cart

```typescript
function addToCart(
  productId: string,
  quantity: number = 1,
  prescription?: PrescriptionData,
  treatments: string[] = []
): void {
  let cart = loadCart() || initializeCart();

  // Check item limit
  if (cart.items.length >= LIMITS.MAX_ITEMS) {
    throw new Error('Cart is full. Maximum 50 items allowed.');
  }

  // Check for duplicate (same product + same prescription)
  const existingIndex = cart.items.findIndex(
    item => item.productId === productId &&
            JSON.stringify(item.prescription) === JSON.stringify(prescription)
  );

  if (existingIndex >= 0) {
    // Update quantity
    cart.items[existingIndex].quantity += quantity;
  } else {
    // Add new item
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId,
      quantity,
      prescription,
      treatments,
      addedAt: new Date().toISOString()
    };
    cart.items.push(newItem);
  }

  cart.updatedAt = new Date().toISOString();
  saveCart(cart);
}
```

### 4. Update Quantity

```typescript
function updateQuantity(itemId: string, quantity: number): void {
  const cart = loadCart();
  if (!cart) return;

  const itemIndex = cart.items.findIndex(item => item.id === itemId);
  if (itemIndex < 0) return;

  if (quantity <= 0) {
    // Remove item
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  cart.updatedAt = new Date().toISOString();
  saveCart(cart);
}
```

### 5. Remove Item

```typescript
function removeFromCart(itemId: string): void {
  const cart = loadCart();
  if (!cart) return;

  cart.items = cart.items.filter(item => item.id !== itemId);
  cart.updatedAt = new Date().toISOString();
  saveCart(cart);
}
```

### 6. Clear Cart

```typescript
function clearCart(): void {
  localStorage.removeItem(CART_STORAGE_KEY);
}
```

### 7. Save Cart

```typescript
function saveCart(cart: LocalStorageCart): void {
  try {
    const cartJson = JSON.stringify(cart);

    // Check size
    const sizeKB = new Blob([cartJson]).size / 1024;
    if (sizeKB > LIMITS.MAX_CART_SIZE_MB * 1024) {
      throw new Error('Cart size exceeds limit. Please remove some items.');
    }

    localStorage.setItem(CART_STORAGE_KEY, cartJson);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please clear some items.');
    }
    throw error;
  }
}
```

---

## Prescription Image Handling

### Image Compression

```typescript
async function compressPrescriptionImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate dimensions (max 1200px width)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG at 80% quality
        const compressed = canvas.toDataURL('image/jpeg', 0.8);

        // Check size
        const sizeKB = new Blob([compressed]).size / 1024;
        if (sizeKB > LIMITS.MAX_IMAGE_SIZE_KB) {
          reject(new Error('Image too large even after compression'));
        }

        resolve(compressed);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
```

---

## Cart Transfer (Registration/Login)

### Transfer Flow

1. User clicks "Proceed to Checkout"
2. If not logged in, show authentication modal
3. User registers or logs in
4. Frontend calls cart transfer API
5. Backend validates and transfers cart to database
6. Frontend clears localStorage cart
7. User proceeds to checkout

### API Endpoint

```typescript
// POST /api/cart/transfer
interface TransferCartRequest {
  items: CartItem[];
}

interface TransferCartResponse {
  success: boolean;
  itemsTransferred: number;
  errors?: string[];
}
```

### Frontend Transfer Logic

```typescript
async function transferCartToDatabase(): Promise<void> {
  const cart = loadCart();
  if (!cart || cart.items.length === 0) return;

  try {
    const response = await fetch('/api/cart/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ items: cart.items })
    });

    if (!response.ok) {
      throw new Error('Cart transfer failed');
    }

    const result: TransferCartResponse = await response.json();

    // Clear localStorage cart
    clearCart();

    // Show success message
    console.log(`Transferred ${result.itemsTransferred} items`);

  } catch (error) {
    console.error('Cart transfer error:', error);
    // Keep localStorage cart intact on error
    throw error;
  }
}
```

### Backend Transfer Logic

```typescript
async function handleCartTransfer(userId: string, items: CartItem[]) {
  const errors: string[] = [];
  let transferredCount = 0;

  for (const item of items) {
    try {
      // Validate product exists
      const product = await db.products.findById(item.productId);
      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      // Validate treatments
      for (const treatmentId of item.treatments) {
        const treatment = await db.lensTreatments.findById(treatmentId);
        if (!treatment) {
          errors.push(`Treatment ${treatmentId} not found`);
          continue;
        }
      }

      // Check for existing cart item
      const existing = await db.cartItems.findOne({
        userId,
        productId: item.productId
      });

      if (existing) {
        // Merge: keep higher quantity
        const newQuantity = Math.max(existing.quantity, item.quantity);
        await db.cartItems.update(existing.id, { quantity: newQuantity });
      } else {
        // Create new cart item
        const cartItem = await db.cartItems.create({
          userId,
          productId: item.productId,
          quantity: item.quantity
        });

        // Add prescription if present
        if (item.prescription && item.prescription.hasPrescription) {
          // Upload prescription image to Supabase Storage
          let imageUrl: string | null = null;
          if (item.prescription.prescriptionImageBase64) {
            imageUrl = await uploadPrescriptionImage(
              userId,
              cartItem.id,
              item.prescription.prescriptionImageBase64
            );
          }

          await db.cartItemPrescriptions.create({
            cartItemId: cartItem.id,
            hasPrescription: true,
            odSph: item.prescription.odSph,
            odCyl: item.prescription.odCyl,
            odAxis: item.prescription.odAxis,
            osSph: item.prescription.osSph,
            osCyl: item.prescription.osCyl,
            osAxis: item.prescription.osAxis,
            pd: item.prescription.pd,
            pdDualOd: item.prescription.pdDualOd,
            pdDualOs: item.prescription.pdDualOs,
            addValue: item.prescription.addValue,
            prescriptionImageUrl: imageUrl
          });
        }

        // Add treatments
        for (const treatmentId of item.treatments) {
          await db.cartItemTreatments.create({
            cartItemId: cartItem.id,
            treatmentId
          });
        }
      }

      transferredCount++;

    } catch (error) {
      console.error('Error transferring item:', error);
      errors.push(`Failed to transfer item ${item.productId}`);
    }
  }

  return {
    success: errors.length === 0,
    itemsTransferred: transferredCount,
    errors: errors.length > 0 ? errors : undefined
  };
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `QuotaExceededError` | localStorage full | Remove items or compress images further |
| `Cart size exceeds limit` | Cart > 2MB | Remove items or reduce image quality |
| `Cart is full` | 50+ items | Remove items before adding more |
| `Image too large` | Prescription > 500KB | Further compress or use different image |
| `Product not found` | Invalid product ID | Skip item during transfer |
| `Storage unavailable` | Private browsing mode | Show warning to user |

### Error Recovery

```typescript
function handleStorageError(error: Error): void {
  if (error.name === 'QuotaExceededError') {
    // Try to free space
    clearExpiredData();

    // Notify user
    showNotification({
      type: 'warning',
      message: 'Tu carrito está lleno. Por favor, elimina algunos artículos.'
    });
  } else {
    // Log error
    console.error('Cart storage error:', error);

    // Notify user
    showNotification({
      type: 'error',
      message: 'Error al guardar el carrito. Por favor, intenta de nuevo.'
    });
  }
}
```

---

## Security Considerations

### Data Validation

1. **Product IDs**: Validate UUIDs before storage
2. **Quantities**: Validate positive integers (1-999)
3. **Prescription Values**: Validate ranges (SPH: -20 to +20, etc.)
4. **Treatment IDs**: Validate UUIDs
5. **Images**: Validate format, size, and content type

### XSS Prevention

- Never use `eval()` on cart data
- Sanitize all user input
- Use Content Security Policy
- Validate JSON structure

### Rate Limiting

- Limit cart operations to prevent abuse
- Throttle add-to-cart requests
- Monitor for suspicious patterns

---

## Testing Strategy

### Unit Tests

```typescript
describe('localStorage Cart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should initialize empty cart', () => {
    const cart = initializeCart();
    expect(cart.items).toHaveLength(0);
    expect(cart.version).toBe('1.0');
  });

  test('should add item to cart', () => {
    addToCart('product-uuid-123', 1);
    const cart = loadCart();
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0].productId).toBe('product-uuid-123');
  });

  test('should merge duplicate items', () => {
    addToCart('product-uuid-123', 1);
    addToCart('product-uuid-123', 2);
    const cart = loadCart();
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0].quantity).toBe(3);
  });

  test('should enforce item limit', () => {
    for (let i = 0; i < 50; i++) {
      addToCart(`product-${i}`, 1);
    }
    expect(() => addToCart('product-51', 1)).toThrow('Cart is full');
  });

  test('should handle expired cart', () => {
    const cart = initializeCart();
    cart.expiresAt = new Date('2020-01-01').toISOString();
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

    const loaded = loadCart();
    expect(loaded).toBeNull();
  });
});
```

### Integration Tests

1. **Add to cart flow**: Browse → Add → View cart
2. **Prescription flow**: Add prescription → Upload image → Save
3. **Checkout flow**: Cart → Login → Transfer → Verify database
4. **Error recovery**: Full storage → Clear → Retry
5. **Expiry handling**: Wait 30 days → Verify cleared

---

## Performance Optimization

### Best Practices

1. **Lazy Loading**: Only load cart when needed
2. **Debouncing**: Throttle quantity updates
3. **Batch Operations**: Group multiple changes
4. **Compression**: Use gzip for large carts
5. **Indexing**: Use Map for fast lookups

### Caching

```typescript
let cartCache: LocalStorageCart | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5000; // 5 seconds

function getCachedCart(): LocalStorageCart | null {
  const now = Date.now();
  if (cartCache && now - cacheTimestamp < CACHE_TTL) {
    return cartCache;
  }

  cartCache = loadCart();
  cacheTimestamp = now;
  return cartCache;
}
```

---

## Monitoring & Analytics

### Metrics to Track

- Cart abandonment rate
- Average items per cart
- Prescription upload success rate
- Cart transfer success rate
- localStorage quota usage
- Image compression ratio

### Event Tracking

```typescript
// Track cart events
analytics.track('cart_item_added', {
  productId: string,
  quantity: number,
  hasPrescription: boolean,
  treatmentCount: number
});

analytics.track('cart_transferred', {
  itemCount: number,
  successRate: number,
  errors: string[]
});
```

---

## Migration Strategy

### Version Changes

If cart schema changes, implement migration:

```typescript
function migrateCart(cart: any): LocalStorageCart {
  // Migrate from v0.9 to v1.0
  if (cart.version === '0.9') {
    return {
      ...cart,
      version: '1.0',
      expiresAt: cart.expiresAt || getDefaultExpiry()
    };
  }

  return cart;
}
```

---

## Summary

This specification provides a complete implementation guide for managing shopping carts in localStorage for unauthenticated users, with seamless transfer to database upon registration.

**Key Takeaways**:
- ✅ Simple, robust data structure
- ✅ Clear size limits and validation
- ✅ Comprehensive error handling
- ✅ Secure transfer mechanism
- ✅ Full test coverage

**Implementation Priority**: P0 (Critical for MVP)

---

**Document Version**: 1.0
**Last Updated**: November 4, 2025
**Maintained By**: Engineering Team
