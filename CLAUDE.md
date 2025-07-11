# Business Management & Sales Tracking System for Fruits & Vegetables Providers

A comprehensive SaaS business management application designed specifically for small fruits and vegetables businesses in Argentina, focusing on fresh produce sales, perishable inventory management, and customer relationship management with integrated payment processing.

## Technical Stack

- **Frontend**: Nuxt 3 (Vue 3)
- **Styling**: Tailwind CSS
- **Database & Hosting**: Firebase (Firestore, Auth, Hosting)
- **State Management**: Pinia (with Firestore integration)
- **Package Manager**: yarn (not npm)
- **Icons**: Various icon packs using `~icons/pack-name/icon-name` syntax
- **Dates**: $dayjs library (not native Date object)
- **Forms**: FormKit library for all forms
- **Utils**: Common functions in `@/utils/index.ts`

## Core Architectural Principles

### 1. State Management & Caching Principle
- **Axiom**: Data fetched from Firestore is always cached in its corresponding Pinia store
- All stores use state flags (e.g., `areClientsFetched`) to prevent redundant API calls
- Check store before making API calls

### 2. Modal-Driven Interface for CRUD
- **Axiom**: All "Create," "Update," and "View Details" actions are handled via modals, not separate pages
- Consistent UI/UX pattern across all modules
- Components follow naming convention: `/entity/EntityDetails.vue`

### 3. Standardized Form Implementation
- **Axiom**: All forms are built using the `FormKit` library
- Ensures consistent look, feel, and validation behavior

### 4. Separation of Concerns for Scripts
- **Axiom**: `/scripts` directory for data maintenance, migration, and administrative tasks
- Keeps core application clean and focused

### 5. Universal Authentication & Business Context
- **Axiom**: Every authenticated API request is tied to a specific `businessId`
- Multi-tenant architecture with data isolation
- `auth.global.ts` middleware enforces authentication and business selection

## Authentication & Business Selection

### Login Flow
- Entry point: `welcome.vue`
- Firebase Google OAuth authentication
- `auth.global.ts` middleware checks authentication state
- Redirects to `/welcome` if not authenticated

### Business Selection
- Businesses stored in `userBusiness` collection
- Selected business ID stored in localStorage with key `cBId`
- Business selection in `index.vue`
- Two types: owner-created and employee-joined businesses
- Role-based permissions in `userRole` collection

## Project Structure

### Core Stores (Pinia)
- `index.ts` - Main store with business context
- `products.ts` - Product management
- `clients.ts` - Customer management
- `orders.ts` - Order processing
- `suppliers.ts` - Supplier management

### Page Structure
- `/resumen/dashboard.vue` - Main dashboard
- `/inventario/index.vue` - Inventory management
- `/pedidos/index.vue` - Order management
- `/clientes/index.vue` - Customer management
- `/proveedores.vue` - Supplier management
- `/empleados/index.vue` - Employee management

### Common Components
- `ModalStructure.vue` - Reusable modal component
- `ConfirmDialogue.vue` - Confirmation dialogs
- `Loader.vue` - Loading indicators

## Database Schema (Firestore)

### Business Management

#### userBusiness
```
userBusiness/{document-id}/
  name: string                    // Business name
  phone: string                   // Contact phone
  description: string|null        // Business description
  address: string|null           // Physical address
  businessType: string           // "frutería", "verdulería", "mixto"
  imageUrl: string|null          // Logo URL
  imageUrlThumbnail: string|null // Thumbnail URL
  ownerUid: string               // Owner user ID
  shippingPrice: number|null     // Default delivery price
  shippingType: string|null      // Default delivery method
  businessUrl: string|null       // Business website
  createdAt: Timestamp
  updatedAt: Timestamp
  archivedAt: Timestamp|null
```

#### userRole
```
userRole/{document-id}/
  userUid: string                // User ID (null until accepted)
  businessId: string             // Business reference
  role: string                   // "propietario", "vendedor", "administrador", "empleado"
  status: string                 // "active", "pending", "archived"
  code: string                   // Invitation code (businessId-XXXX)
  invitedBy: string              // Inviter user ID
  invitedAt: Timestamp
  acceptedAt: Timestamp|null
  createdAt: Timestamp
  updatedAt: Timestamp
  archivedBy: string|null        // Who archived
  archivedAt: Timestamp|null     // When archived
  reactivatedBy: string|null     // Who reactivated
  reactivatedAt: Timestamp|null  // When reactivated
```

### Product Management

#### producto
```
producto/{document-id}/
  businessId: string             // Business reference
  productName: string            // Product name
  description: string|null       // Product description
  unit: string                   // Unit of measurement
  step: number                   // Minimum order quantity
  price: number                  // Sale price per unit
  cost: number                   // Cost per unit
  category: string               // Product category
  season: string|null            // Seasonal availability
  isAvailable: boolean           // Availability status
  highlightProduct: boolean      // Featured product flag
  expirationDays: number|null    // Days until expiration
  imageUrl: string|null          // Product image URL
  productImageId: string|null    // Image reference
  productStock: number           // Current stock level
  supplierName: string|null      // Supplier name
  userUid: string                // Creator user ID
  createdAt: Timestamp
  updatedAt: Timestamp|null
  archivedAt: Timestamp|null
```

#### stockMovements
```
stockMovements/{document-id}/
  businessId: string             // Business reference
  productId: string              // Product reference
  productName: string            // Product name snapshot
  type: string                   // "SALE", "RETURN", "ADDITION", "SPOILAGE"
  quantity: number               // Movement quantity
  previousStock: number          // Stock before movement
  newStock: number               // Stock after movement
  previousCost: number           // Previous unit cost
  newCost: number                // New unit cost
  unitBuyingPrice: number|null   // Purchase price
  expirationDate: Timestamp|null // Batch expiration
  qualityNotes: string|null      // Quality notes
  notes: string|null             // Additional notes
  orderId: string|null           // Associated order
  createdAt: Timestamp
  userUid: string                // User who recorded
```

### Customer Management

#### cliente
```
cliente/{document-id}/
  businessId: string             // Business reference
  clientName: string             // Customer name
  phone: string                  // Contact phone
  address: string|null           // Delivery address
  lat: number|null               // Latitude
  lng: number|null               // Longitude
  clientType: string|null        // "particular", "restaurant", "comercio"
  preferredDeliveryTime: string|null // Delivery time preference
  userUid: string                // Creator user ID
  fromEmprendeVerde: boolean     // EmprendeVerde platform flag
  createdAt: Timestamp
  updatedAt: Timestamp|null
  archivedAt: Timestamp|null
```

### Order Management

#### pedido
```
pedido/{document-id}/
  businessId: string             // Business reference
  clientId: string               // Client reference
  client: {                      // Client snapshot
    clientName: string
    phone: string
    address: string|null
    clientType: string|null
    fromEmprendeVerde: boolean|null
    lat: number|null
    lng: number|null
  }
  products: Array<{              // Order items
    productId: string
    productName: string
    quantity: number
    price: number
    unit: string
    total: number
    stockUsed: number
    season: string|null
    expirationDate: Timestamp|null
  }>
  userUid: string                // Order creator
  shippingDate: Timestamp        // Delivery date
  shippingType: string|null      // Delivery method
  shippingPrice: number          // Delivery cost
  totalAmount: number            // Grand total
  totalProductsAmount: number    // Products subtotal
  deliveryPriority: string|null  // Priority level
  orderStatus: string            // Current status
  createdAt: Timestamp
```

#### pedidoStatusLog
```
pedidoStatusLog/{document-id}/
  orderId: string                // Order reference
  orderStatus: string            // New status
  message: string|null           // Status notes
  freshnessNote: string|null     // Freshness notes
  createdAt: Timestamp
  userUid: string                // User who changed status
```

### Supplier Management

#### suppliers
```
suppliers/{document-id}/
  businessId: string             // Business reference
  name: string                   // Supplier name
  supplierType: string|null      // "mayorista", "productor", "mercado"
  location: string|null          // Supplier location
  specialties: Array<string>     // Produce specialties
  userUid: string                // Creator user ID
  createdAt: Timestamp
  updatedAt: Timestamp|null
  archivedAt: Timestamp|null
```

### Analytics & Tracking

#### dailyProductCost
```
dailyProductCost/{document-id}/
  businessId: string             // Business reference
  productId: string              // Product reference
  productName: string            // Product name
  cost: number                   // Daily cost per unit
  season: string|null            // Current season
  supplierName: string|null      // Supplier name
  date: Timestamp                // Cost record date
  createdAt: Timestamp
  updatedAt: Timestamp|null
```

#### clientRecommendations
```
clientRecommendations/{document-id}/
  businessId: string             // Business reference
  clientId: string               // Target client
  recommendations: any           // Recommendation data
  seasonalProducts: Array<string> // Seasonal suggestions
  createdAt: Timestamp
  ordersAnalyzed: number         // Orders used for analysis
```

## Development Commands

```bash
# Development
yarn dev

# Build
yarn build

# Generate static files
yarn generate

# Preview production build
yarn preview
```

## Key Features

### Fresh Produce Management
- Dual-unit inventory system (bulk + individual pieces)
- Expiration date tracking and alerts
- Seasonal product availability
- Spoilage tracking and waste reduction
- Quality control and supplier ratings

### Order Processing
- Real-time inventory updates
- Freshness-optimized delivery scheduling
- Geographic delivery optimization
- Multiple delivery methods
- Quality checkpoints

### Customer Management
- Geographic location tracking
- Delivery preference management
- Customer segmentation
- EmprendeVerde platform integration
- Seasonal buying pattern analysis

### Business Analytics
- Seasonal performance metrics
- Spoilage and waste reports
- Cost tracking with seasonality
- Customer behavior analysis
- Delivery optimization insights

## Subscription Plans

### Plan Gratuito (Free)
- Basic inventory management
- Up to 20 products
- Max 30 orders/day
- Max 20 clients
- One business per account
- Basic dashboard statistics

### Plan Profesional (ARS 24,999/month)
- Unlimited products
- Employee management with permissions
- Unlimited orders and clients
- Multiple businesses per account
- Advanced geographic statistics
- Advanced inventory analytics
- Stock forecasting and profitability analysis

## Development Guidelines

1. **Always check store state before API calls**
2. **Use modals for all CRUD operations**
3. **Follow FormKit for all forms**
4. **Maintain business context in all operations**
5. **Use $dayjs for date operations**
6. **Create utility functions in `@/utils/index.ts`**
7. **Follow component naming conventions**
8. **Use toast notifications for user feedback**
9. **Implement confirmation dialogs for destructive actions**
10. **Maintain mobile responsiveness**