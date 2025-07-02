# Business Management & Sales Tracking System for Fruits & Vegetables Providers

A comprehensive SaaS business management application designed specifically for small fruits and vegetables businesses in Argentina, focusing on fresh produce sales, perishable inventory management, and customer relationship management with integrated payment processing.

## Overview

This system provides a complete solution for fruits and vegetables providers to manage their operations, from perishable inventory tracking to customer relationships and financial analysis. Built as a client-side Nuxt 3 application with Firebase backend, it offers a scalable platform that supports multiple fresh produce businesses with role-based access control and subscription-based monetization through MercadoPago Argentina.

## Technical Stack

- Frontend: Nuxt 3 (Vue 3)
- Styling: Tailwind CSS
- Database & Hosting: Firebase
- State Management: Pinia (with Firestore integration)
- Current Scope: Admin dashboard (client portal planned for future)
- Package dependencies: yarn (not npm)

## Code Architecture

### Core Architectural Principles

This project follows a set of core architectural principles to ensure consistency, maintainability, and performance. All new development should adhere to these axioms:

1.  **State Management & Caching Principle:**
    *   **Axiom:** Data fetched from Firestore is always cached in its corresponding Pinia store.
    *   **Why it's valuable:** This is the application's primary performance strategy. It prevents redundant reads from Firebase by treating the Pinia store as a temporary, client-side cache. Any developer adding a new feature must adhere to this pattern: check the store for data before making an API call. This is tracked via state flags like `areClientsFetched`.

2.  **Modal-Driven Interface for CRUD:**
    *   **Axiom:** All "Create," "Update," and "View Details" actions are handled via modals, not separate pages.
    *   **Why it's valuable:** This establishes a fundamental UI/UX pattern. It ensures a consistent user experience across different modules and simplifies the application's routing. Developers should not create new pages for these actions but instead build or reuse modal components.

3.  **Standardized Form Implementation:**
    *   **Axiom:** All forms are built using the `FormKit` library.
    *   **Why it's valuable:** This ensures all forms throughout the application have a consistent look, feel, and validation behavior. It saves development time and enforces a unified design language.

4.  **Separation of Concerns for Scripts:**
    *   **Axiom:** The `/scripts` directory is the designated location for all data maintenance, migration, and one-off administrative tasks.
    *   **Why it's valuable:** This keeps the core application codebase clean and focused on user-facing features. It makes it clear where to find and create tools for managing the application's data behind the scenes.

5.  **Universal Authentication & Business Context:**
    *   **Axiom:** Every authenticated API request and data operation is tied to a specific `businessId`.
    *   **Why it's valuable:** This is the cornerstone of the multi-tenant architecture. The `auth.global.ts` middleware enforces that a user is logged in and has selected a business. This principle must be respected in every Pinia store and component to ensure data isolation and security.


#### Package JSON scripts and dependencies

```
{
  "name": "nuxt-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@pinia/nuxt": "0.11.0",
    "@tailwindcss/vite": "^4.1.7",
    "@vueuse/nuxt": "13.2.0",
    "firebase": "^11.7.3",
    "nuxt": "^3.17.3",
    "nuxt-vuefire": "1.0.5",
    "pinia": "^3.0.2",
    "tailwindcss": "^4.1.7",
    "unplugin-icons": "^22.1.0",
    "vue": "^3.5.13",
    "vue-router": "^4.5.1",
    "vue3-toastify": "^0.2.8",
    "vuefire": "^3.2.1"
  },
  "devDependencies": {
    "@iconify/json": "^2.2.339",
    "@iconify/utils": "^2.3.0",
    "dayjs-nuxt": "^2.1.11"
  }
}
```

#### Login System Architecture

The login system uses Firebase Authentication:

- **Entry Point**: `welcome.vue`

  - Users are redirected here if not authenticated
  - Sign-in is handled with Google OAuth via Firebase

- **Authentication Flow**:

  - `googleSignIn()` function triggers Firebase authentication
  - Upon successful authentication, users are redirected to their requested page or the default route

- **Auth Middleware**:

  - Global route middleware in `auth.global.ts` checks authentication state
  - Uses `getCurrentUser()` to verify if a user is logged in
  - Unauthenticated users are redirected to `/welcome` with the intended destination in query params
  - Also checks business selection and permissions

- **Sign Out**:
  - Implemented in `signOut()` function in both `default.vue` layout and `blocked.vue`
  - Calls Firebase Auth's `signOut()` method and redirects to `/welcome`

#### Business Selection Architecture

- **Business Storage**:

  - Businesses are stored in Firestore's `userBusiness` collection
  - The selected business ID is stored in localStorage with key `cBId`

- **Selection Flow**:

  - Users see businesses in `index.vue`
  - Selection is managed by `changeCurrentBusiness()` in `index.ts`
  - When a business is selected, ID is saved to localStorage and page is reloaded

- **Business Types**:

  - Two types: owner-created businesses and employee-joined businesses
  - Distinction is made with `isEmployee` field in the database
  - Role-based permissions stored in `userRole` collection

- **Create/Join Flow**:
  - Create: `saveBusiness()` in `index.ts` handles business creation
  - Join: Employees use invitation codes via `joinBusiness()` function
  - Codes follow format: `${businessId}-${4-digit-number}`

#### Firebase Deployment Architecture

The application is configured for Firebase hosting and services:

- **Environment Configuration**:

  - Development/production environment distinction via `config.public.env`
  - Firebase configuration is injected through Nuxt's runtime config

- **Firebase Services Used**:

  - Authentication (Google sign-in)
  - Firestore Database (data storage)
  - Hosting (web application)

- **Environment Indication**:
  - Development environment shows "Test Environment" banner

#### Firestore Connection Architecture

- **Store Pattern**:

  - Uses Pinia stores (`defineStore`) to manage state and Firebase interactions
  - Main stores: `index.ts`, `products.ts`, `clients.ts`, `orders.ts`, `suppliers.ts`

- **State Management & Caching Principle**:

  - Data fetched from Firestore is always cached in its corresponding Pinia store to prevent redundant API calls.
  - Each store uses a state flag (e.g., `areClientsFetched`) to track whether the initial data has been loaded.
  - Before fetching data, the application should check this flag to determine if a new fetch is necessary.

- **Common Connection Pattern**:

  - Each store validates prerequisites with helper functions that check:
    - User authentication status via `useCurrentUser()`
    - Selected business ID via `useLocalStorage("cBId", null)`
  - CRUD operations follow consistent patterns with error handling and toast notifications

- **Data Flow Pattern**:

  - Fetch: Query Firestore collections with filters (typically `businessId`)
  - Update: Use `updateDoc` with specific document references
  - Create: Use `addDoc` with collection references
  - Delete: Use `deleteDoc` or set archive flag via `updateDoc`

- **Business Context**:
  - All data operations filtered by current business ID
  - Role-based access controls verified before operations

#### Page Structure Architecture

- **Main Layout** (`/layouts/default.vue`):

  - Sidebar navigation with business selector and menu items
  - Role-based menu visibility
  - Mobile-responsive design with collapsible sidebar

- **Core Components**:

  - `ModalStructure.vue`: Reusable modal dialog component
  - `ConfirmDialogue.vue`: Confirmation dialog system
  - `Loader.vue`: Loading indicator
  - All components follow the naming convention `/entity/EntityDetails.vue` Where the folder is included in the name of the component

- **Page Structure Pattern**:

  - List views → Detail views → Edit views (ALL HANDLED VIA MODALS)
  - Common sections: header with title/description, action buttons, content area

- **Design System**:

  - Based on Tailwind CSS with custom color scheme
  - Main colors: primary (actions), secondary (background), danger (destructive)
  - Icons from various icon packs using the syntax `~icons/pack-name/icon-name`
  - Toast notification system for user feedback

- **Data Interaction Pattern**:
  - Components expose `showModal()` method for displaying details/editors
  - CRUD operations trigger store actions
  - Success/error feedback via toast notifications

This architecture follows a consistent pattern across the application, making it maintainable and extensible while leveraging Firebase services.

## Business Model & Monetization

### SaaS Architecture

- **Client-Side Application**: Nuxt 3/Vue 3 single-page application
- **Subscription-Based**: Paid access to fresh produce business management tools
- **Multi-Tenant**: Each fruits and vegetables business operates in isolated environment
- **Argentine Market Focus**: Localized for Argentina with peso pricing and fresh produce terminology

### Target Market

- **Primary Focus**: Fruits and vegetables providers (fruterías, verdulerías)
- **Business Types**: Fresh produce retailers, wholesale distributors, local markets
- **Specialized Features**: Perishable inventory management, seasonal product tracking
- **Local Integration**: EmprendeVerde platform compatibility for local produce networks

### Payment Integration

- **MercadoPago Argentina**: Primary payment processor for subscriptions
- **Subscription Tiers**: Multiple pricing levels based on features and produce volume
- **Trial Period**: Free trial access to encourage adoption by produce businesses
- **Automatic Billing**: Recurring subscription management

### Access Control Strategy

- **Public Landing Page**: Open access for marketing to produce businesses
- **Private Application**: Authentication required for all business tools
- **Role-Based Permissions**: Owner/Employee access levels within produce businesses
- **SEO Optimization**: Public pages optimized for fruits and vegetables business searches

## Core Functionality

### Perishable Inventory Management

- Real-time fresh produce stock level tracking
- Expiration date monitoring and alerts
- Seasonal availability tracking
- Cost monitoring and profit margin analysis for perishable goods
- Automated stock movement logging with spoilage tracking
- Product categorization by produce type (fruits, vegetables, herbs, etc.)

### Fresh Produce Order Processing

- Complete order lifecycle management for fresh products
- Status tracking with detailed logs including freshness indicators
- Multiple delivery options optimized for fresh produce
- Automated stock deduction with expiration date consideration
- Seasonal product recommendations

### Client Management for Produce Businesses

- Comprehensive customer database with dietary preferences
- Geographic location tracking for fresh delivery optimization
- Client segmentation based on purchase patterns (restaurants, families, retailers)
- Integration with EmprendeVerde platform for local produce networks
- Seasonal customer behavior analysis

### Business Analytics for Fresh Produce

- Performance metrics dashboard with seasonality insights
- Sales analysis and reporting tools for perishable goods
- Cost tracking and profitability analysis considering spoilage
- Stock forecasting based on seasonal patterns and usage trends
- Waste reduction analytics and recommendations

## Fresh Produce Management System Architecture

Following the established architecture pattern, the Fresh Produce Management System will implement these core modules using the same architectural principles:

### Core Modules Implementation

#### 1. Perishable Inventory Management

**Data Requirements:**

- **Dual-Unit System for Fresh Produce:**
  - Bulk quantities (counted as units like boxes, bags)
  - Individual pieces (tracked by piece/weight)
  - Display format: "5 boxes + 12 pieces" for mixed inventory
- **Seasonal Products:** Tracked with availability periods and quality grades
- **Automatic Integration with Orders:**
  - Real-time stock updates per order processing
  - Automatic deduction based on order quantities
  - Support for partial batch sales (expiration-based)
- **Freshness Management:**
  - Expiration date alerts
  - Product rotation analytics (FIFO)
  - Cost and price tracking with spoilage consideration
  - Inventory adjustment capabilities for spoilage
- **Product Classification:**
  - Seasonal availability tracking
  - Product categories and subcategories
  - Supplier association with quality ratings

**Implementation Pattern:**

- **Store**: `products.ts` Pinia store
- **Components**:
  - `ProductList.vue` - List of all fresh produce
  - `products/ProductDetails.vue` - Modal for viewing, creating and editing product details with seasonality.
  - `products/InventoryAdjustment.vue` - Modal for adjusting inventory levels and spoilage
- **Firestore Collections**:
  - `producto` - Product catalog with seasonal data
  - `stockMovements` - Record of inventory changes including spoilage

#### 2. Customer Management for Produce Businesses

**Data Requirements:**

- Customer profiles with contact information and delivery preferences
- Geographic location for delivery optimization
- Customer type classification (restaurant, family, retailer)
- Purchase history linked to order transactions
- Customer loyalty status and seasonal preferences
- Integration with EmprendeVerde platform
- Dietary preferences and seasonal buying patterns

**Implementation Pattern:**

- **Store**: `clients.ts` Pinia store
- **Components**:
  - `ClientList.vue` - List of all clients with location mapping
  - `clients/ClientDetails.vue` - Modal for viewing client details with delivery info
  - `clients/ClientForm.vue` - Modal for creating/editing clients
  - `clients/ClientRecommendations.vue` - Modal for seasonal recommendations
- **Firestore Collections**:
  - `cliente` - Customer information with geographic data
  - `clientRecommendations` - AI-powered seasonal suggestions

#### 3. Supplier Management for Fresh Produce

**Data Requirements:**

- Supplier profiles with produce specialties
- Purchase history by supplier with quality tracking
- Seasonal supplier relationships
- Quality ratings and reliability metrics
- Outstanding balances and payment terms
- Local producer vs wholesale market classification

**Implementation Pattern:**

- **Store**: `suppliers.ts` Pinia store
- **Components**:
  - `SupplierList.vue` - List of all suppliers with specialties
  - `suppliers/SupplierDetails.vue` - Modal for viewing supplier details with quality metrics
  - `suppliers/SupplierForm.vue` - Modal for creating/editing suppliers
- **Firestore Collections**:
  - `suppliers` - Supplier information with produce specialties

#### 4. Fresh Produce Order Management

**Data Requirements:**

- Complete order lifecycle with freshness considerations
- Product selection with real-time inventory and expiration dates
- Multiple delivery methods optimized for fresh produce
- Order status tracking with quality control checkpoints
- Customer delivery preferences and time windows
- Seasonal order patterns and recommendations

**Implementation Pattern:**

- **Store**: `orders.ts` Pinia store
- **Components**:
  - `OrderList.vue` - List of all orders with delivery status
  - `orders/OrderDetails.vue` - Modal for viewing order details with freshness tracking
  - `orders/OrderForm.vue` - Modal for creating/editing orders
  - `orders/OrderStatusTracking.vue` - Modal for status updates with quality notes
- **Firestore Collections**:
  - `pedido` - Order information with delivery optimization
  - `pedidoStatusLog` - Order status history with freshness notes

## Page Folder Structure

Following the architecture pattern of using modals for details and edits rather than separate pages:

### 1. Dashboard

- `/resumen/dashboard.vue` - Main dashboard overview with seasonal metrics, spoilage alerts, and key fresh produce notifications

### 2. Inventario (Fresh Produce Inventory)

- `/inventario`
  - `/inventario/index.vue` - Fresh produce inventory overview with modals for:
    - `products/ProductDetails.vue` - View product details with seasonality and freshness data
    - `products/InventoryAdjustment.vue` - Make inventory adjustments including spoilage tracking
    - `products/SeasonalAvailability.vue` - Manage seasonal product availability

### 3. Pedidos (Fresh Produce Orders)

- `/pedidos`
  - `/pedidos/index.vue` - Order management with freshness optimization and modals for:
    - `orders/OrderDetails.vue` - View order details with delivery tracking and freshness notes
    - `orders/OrderForm.vue` - Create/edit orders with real-time inventory and expiration consideration
    - `orders/OrderStatusTracking.vue` - Update order status with quality control checkpoints
    - `orders/DeliveryOptimization.vue` - Route and timing optimization for fresh delivery

### 4. Clientes (Customers)

- `/clientes`
  - `/clientes/index.vue` - Customer directory with geographic mapping and modals for:
    - `clients/ClientDetails.vue` - View client profile with tabs for:
      - Client information and delivery preferences
      - Purchase history with seasonal patterns
      - Dietary preferences and seasonal recommendations
    - `clients/ClientForm.vue` - Add/edit client information with location mapping
    - `clients/ClientRecommendations.vue` - Seasonal product recommendations and EmprendeVerde integration

### 5. Proveedores (Suppliers)

- `/proveedores.vue` - Supplier directory with produce specialties and modals for:
    - `suppliers/SupplierDetails.vue` - View supplier details with tabs for:
      - Supplier information and produce specialties
      - Purchase history with quality tracking
      - Seasonal relationship management
    - `suppliers/SupplierForm.vue` - Add/edit supplier information with specialty tracking
    - `suppliers/QualityTracking.vue` - Quality ratings and performance metrics

### 6. Resumen (Reports)

- `/resumen`
  - `/resumen/index.vue` - Fresh produce analytics dashboard with:
    - Seasonal performance metrics
    - Spoilage and waste reduction reports
    - Delivery optimization analytics
    - Customer behavior and seasonal trends

### 7. Empleados (Settings)

- `/empleados`
  - `/empleados/index.vue` - Employee management for produce businesses

## UI/UX Implementation

Following the architecture pattern:

### UI Flow Patterns

- **Addition/Edition → Modal Pattern**: All entity management follows add/edit-with-modal pattern instead of navigating to separate add/detail pages
- **Standardized Form Implementation**: All forms are built using the `FormKit` library to ensure a consistent look, feel, and validation behavior.
- **Toast Notifications**: All operations provide feedback through toast notifications (`useToast` composable)
- **Confirmation Dialogs**: All destructive actions require confirmation
- **Mobile Responsiveness**: Sidebar collapses to menu button on small screens
- **Geographic Integration**: Map components for client locations and delivery optimization

### Design System

- **Tailwind CSS**: Custom color scheme matching fresh produce business aesthetic:
  - Primary: Action buttons and highlighted items (fresh green themes)
  - Secondary: Background elements (earth tones)
  - Danger: Destructive actions and spoilage alerts (red tones)
  - Success: Fresh/good quality indicators (green tones)
- **Icon System**: Using icon packs with `~icons/pack-name/icon-name` syntax
- **Utils functions**: For commons functions like "formatCurrency" or "formatQuantity" let's always create the function in `@/utils/index.ts` if doesn't exist already.
- **Dates management**: Always choose to use $dayjs library instead of Date native object

## Future Enhancements

- Weather integration for demand prediction
- Advanced spoilage prediction algorithms
- EmprendeVerde platform deep integration
- Mobile app for delivery drivers
- IoT integration for temperature monitoring

---

# Fresh Produce Database Structure

This document outlines the Firestore database structure for the Fresh Produce application, following the established architectural patterns.

## Business Management

### userBusiness

Stores information about fresh produce businesses owned by users or where users are employed.

```
userBusiness/
  {document-id}/
    name: string // Name of the business (e.g., "Frutería San Martín")
    phone: string // Business phone number
    description: string|null // Business description
    address: string|null // Physical address
    businessType: string // "frutería", "verdulería", "mixto"
    imageUrl: string|null // URL for business logo/image
    imageUrlThumbnail: string|null // URL for thumbnail version of the business image
    userBusinessImageId: string|null // Reference to image document (if applicable)
    ownerUid: string // UID of business owner
    shippingPrice: number|null // Default delivery price
    shippingType: string|null // Default delivery method
    businessUrl: string|null // Business website/URL
    createdAt: Timestamp // When the business was created
    updatedAt: Timestamp // When the business was last updated
    archivedAt: Timestamp // When the business was archived (if applicable)
```

### userRole

Stores role information for all users associated with a fresh produce business.

```
userRole/
  {document-id}/
    userUid: string // User ID (null until invitation is accepted)
    businessId: string // Business ID this role is for
    role: string // Role name (e.g., "propietario", "vendedor", "administrador", "empleado")
    status: string // Status ("active", "pending", "archived")
    code: string // Invitation code (format: businessId-XXXX)
    invitedBy: string // User ID who created the invitation
    invitedAt: Timestamp // When the invitation was created
    acceptedAt: Timestamp // When the invitation was accepted (null if pending)
    createdAt: Timestamp // When the record was created
    updatedAt: Timestamp // When the record was last updated

    // Employee deactivation fields
    archivedBy: string // User ID who deactivated the employee (if applicable)
    archivedAt: Timestamp // When the employee was deactivated (if applicable)
    reactivatedBy: string // User ID who reactivated the employee (if applicable)
    reactivatedAt: Timestamp // When the employee was reactivated (if applicable)
```

## Fresh Produce Management

### producto

Product catalog for fresh produce businesses.

```
producto/
  {document-id}/
    businessId: string           // References the business this product belongs to
    productName: string          // Product name (e.g., "Tomate", "Manzana")
    description: string|null     // Product description (variety, origin, etc.)
    unit: string                 // Unit of measurement (kg, unidad, cajón, etc.)
    step: number                 // Minimum order quantity step
    price: number                // Sale price per unit
    cost: number                 // Cost per unit from supplier
    category: string             // Produce category (frutas, verduras, hierbas, etc.)
    season: string|null          // Seasonal availability (verano, invierno, todo el año)
    isAvailable: boolean         // Current availability status
    highlightProduct: boolean    // Featured seasonal product flag
    expirationDays: number|null  // Average days until expiration
    imageUrl: string|null        // Product image URL
    productImageId: string|null  // Image document reference
    productStock: number         // Current stock level
    supplierName: string|null    // Produce supplier name
    userUid: string              // Creator/updater user ID
    createdAt: Timestamp         // Creation timestamp
    updatedAt: Timestamp|null    // Last update timestamp
    archivedAt: Timestamp|null   // Archive timestamp (soft delete)
```

### cliente

Customer information and profiles for fresh produce businesses.

```
cliente/
  {document-id}/
    businessId: string           // References the business
    clientName: string           // Customer name
    phone: string                // Contact phone number
    address: string|null         // Physical address for fresh delivery
    lat: number|null             // Latitude coordinate
    lng: number|null             // Longitude coordinate
    clientType: string|null      // "particular", "restaurant", "comercio"
    preferredDeliveryTime: string|null // Optimal delivery time for freshness
    userUid: string              // Creator user ID
    fromEmprendeVerde: boolean   // EmprendeVerde platform flag
    createdAt: Timestamp         // Creation timestamp
    updatedAt: Timestamp|null    // Last update timestamp
    archivedAt: Timestamp|null   // Archive timestamp (soft delete)
```

### pedido

Complete order management for fresh produce with delivery optimization.

```
pedido/
  {document-id}/
    businessId: string          // Business reference
    clientId: string            // Client document reference
    client: {                   // Customer information snapshot
      clientName: string
      phone: string
      address: string|null
      clientType: string|null
      fromEmprendeVerde?: boolean
      lat?: number
      lng?: number
    }
    products: Array<{           // Ordered produce array
      productId: string         // Product reference
      productName: string       // Product name snapshot
      quantity: number          // Ordered quantity
      price: number             // Unit price at order time
      unit: string              // Unit of measurement
      total: number             // Line total (quantity × price)
      stockUsed: number         // Stock consumed
      season: string|null       // Product season
      expirationDate: Timestamp|null // Expected expiration for this batch
    }>
    userUid: string             // Order creator
    shippingDate: Timestamp     // Scheduled delivery date (important for freshness)
    shippingType: string|null   // "Envío", "Retiro en Local", or null
    shippingPrice: number       // Delivery cost
    totalAmount: number         // Grand total (products + delivery)
    totalProductsAmount: number // Products subtotal
    deliveryPriority: string|null // "urgent" for highly perishable items
    orderStatus: string         // Current order status
    createdAt: Timestamp        // Order creation timestamp
```

### pedidoStatusLog

Order status tracking with freshness considerations.

```
pedidoStatusLog/
  {document-id}/
    orderId: string             // Parent order reference
    orderStatus: string         // New status value
    message: string|null        // Optional status change notes
    freshnessNote: string|null  // Freshness or quality notes
    createdAt: Timestamp        // Status change timestamp
    userUid: string             // User who changed the status
```

### stockMovements

Comprehensive inventory movement tracking system for perishable goods.

```
stockMovements/
  {document-id}/
    businessId: string           // Business reference
    productId: string            // Product reference
    productName: string          // Product name snapshot
    type: string                 // Movement type: "SALE", "RETURN", "ADDITION", "SPOILAGE"
    quantity: number             // Movement quantity (negative for outbound)
    previousStock: number        // Stock level before movement
    newStock: number             // Stock level after movement
    previousCost: number         // Previous unit cost
    newCost: number              // New unit cost
    unitBuyingPrice: number|null // Purchase price (for additions)
    expirationDate: Timestamp|null // Expiration date for this batch
    qualityNotes: string|null    // Quality or freshness notes
    notes: string|null           // Additional movement notes
    orderId: string|null         // Associated order reference
    createdAt: Timestamp         // Movement timestamp
    userUid: string              // User who recorded the movement
```

### suppliers

Supplier management for fresh produce procurement.

```
suppliers/
  {document-id}/
    businessId: string          // Business reference
    name: string                // Supplier name (mercado central, productor local, etc.)
    supplierType: string|null   // "mayorista", "productor", "mercado"
    location: string|null       // Supplier location
    specialties: Array<string>  // Produce specialties
    userUid: string             // User who added supplier
    createdAt: Timestamp        // Creation timestamp
    updatedAt: Timestamp|null   // Last update timestamp
    archivedAt: Timestamp|null  // Archive timestamp (soft delete)
```

### dailyProductCost

Tracks historical cost data for financial analysis with seasonal variations.

```
dailyProductCost/
  {document-id}/
    businessId: string          // Business reference
    productId: string           // Product reference
    productName: string         // Product name snapshot
    cost: number                // Daily cost per unit
    season: string|null         // Current season
    supplierName: string|null   // Supplier name
    date: Timestamp             // Date for cost record
    createdAt: Timestamp        // Record creation timestamp
    updatedAt: Timestamp|null   // Last update timestamp
```

### clientRecommendations

AI-powered and manual customer recommendations for fresh produce.

```
clientRecommendations/
  {document-id}/
    businessId: string          // Business reference
    clientId: string            // Target client reference
    recommendations: any        // Recommendation data structure
    seasonalProducts: Array<string> // Seasonal product suggestions
    createdAt: Timestamp        // Generation timestamp
    ordersAnalyzed: number      // Number of orders used for analysis
```

## Scaling Architecture Requirements

### Public Website Structure

#### Landing Page (`pages/index.vue`)

- **Hero Section**: Focus on fresh produce business management
- **Feature Showcase**: Demonstrations of inventory management for perishables
- **Pricing Plans**: Subscription tiers for different business sizes
- **Success Stories**: Testimonials from local produce businesses
- **Call-to-Action**: Free trial for fresh produce businesses

#### Marketing Pages

- **Features for Produce Businesses**: Specialized tool explanations
- **Pricing for Fruterías**: Detailed subscription comparison
- **About**: Focus on fresh produce industry expertise
- **Contact**: Support for produce business owners
- **Blog/Resources**: Fresh produce business tips and seasonal guides

### Subscription Tiers for Produce Businesses

```javascript
subscriptionPlans: {
  plan_gratuito: {
    name: "Plan Gratuito",
    price: 0, // Free
    features: [
      "Gestión básica de inventario y productos",
      "Hasta 20 productos con control de stock",
      "Sin acceso para empleados",
      "Gestión de pedidos (máx. 30/día)",
      "Gestión de clientes (máx. 20)",
      "Un solo negocio por cuenta",
      "Solo estadísticas básicas en dashboard",
      "Gestión de proveedores"
    ]
  },
  plan_profesional: {
    name: "Plan Profesional",
    price: 24999, // ARS per month
    features: [
      "Productos ilimitados",
      "Gestión de empleados con permisos",
      "Pedidos y clientes ilimitados",
      "Múltiples negocios en una cuenta",
      "Estadísticas de clientes con mapa geográfico",
      "Estadísticas avanzadas de movimientos de inventario",
      "Previsión de stock y análisis de rentabilidad"
    ]
  }
}
```

## Implementation Roadmap

### Phase 1: Core Fresh Produce Features

1. Implement modal-based product management with seasonal tracking
2. Create client management with geographic optimization
3. Develop order processing with freshness considerations
4. Add supplier management with quality tracking

### Phase 2: Advanced Perishable Management

1. Implement expiration date tracking and alerts
2. Add spoilage tracking and waste reduction analytics
3. Create seasonal availability management
4. Develop delivery optimization features

### Phase 3: Market Integration & Analytics

1. EmprendeVerde platform enhanced integration
2. Advanced analytics for seasonal patterns
3. Weather-based demand prediction
4. Quality control and supplier rating systems

This specialized system follows the established architectural patterns while providing comprehensive fresh produce management capabilities optimized for the unique challenges of fruits and vegetables businesses.
