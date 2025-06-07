# Business Management & Sales Tracking System

A comprehensive business management application designed for small businesses, focusing on sales, inventory, and customer relationship management.

## Overview

This system provides a complete solution for small businesses to manage their operations, from inventory tracking to customer relationships and financial analysis. Built with modern web technologies, it offers a scalable platform that supports multiple businesses with role-based access control.

## Core Functionality

### Inventory Management

- Real-time product stock level tracking
- Cost monitoring and profit margin analysis
- Automated stock movement logging
- Product categorization and availability management

### Order Processing

- Complete order lifecycle management
- Status tracking with detailed logs
- Multiple shipping options (delivery/pickup)
- Automated stock deduction upon order processing

### Client Management

- Comprehensive customer database
- Geographic location tracking for delivery optimization
- Client segmentation and analysis
- Integration with EmprendeVerde platform

### Business Analytics

- Performance metrics dashboard
- Sales analysis and reporting tools
- Cost tracking and profitability analysis
- Stock forecasting based on usage patterns

## Technical Architecture

### Frontend

- **Framework**: Nuxt 3
- **Authentication**: Firebase Auth with role-based access control
- **UI**: Responsive design with mobile support

### Backend

- **Database**: Firebase/Firestore
- **Storage**: Cloud storage for images
- **Architecture**: Serverless with real-time data synchronization

### Key Features

- **Multi-business Support**: Single platform managing multiple businesses
- **Geographic Analysis**: Client mapping for targeted marketing
- **Employee Management**: Different permission levels for owners and employees
- **Real-time Updates**: Live data synchronization across all users

## Database Structure

### Products (`producto`)

Stores comprehensive product information for each business.

```javascript
producto/{document-id}/
  productName: string           // Name of the product
  description: string|null      // Product description
  unit: string                 // Unit of measurement (kg, unidad, etc.)
  step: number                 // Minimum order quantity step
  price: number                // Sale price per unit
  category: string             // Product category
  isAvailable: boolean         // Availability status
  highlightProduct: boolean    // Featured product flag
  imageUrl: string|null        // Product image URL
  productImageId: string|null  // Image document reference
  productStock: number         // Current stock level
  cost: number                 // Cost per unit
  businessId: string           // Business reference
  userUid: string              // Creator/updater user ID
  createdAt: Timestamp         // Creation timestamp
  updatedAt: Timestamp|null    // Last update timestamp
  archivedAt: Timestamp|null   // Archive timestamp (soft delete)
```

### Clients (`cliente`)

Manages customer information and geographic data.

```javascript
cliente/{document-id}/
  clientName: string           // Customer name
  phone: string                // Contact phone number
  address: string|null         // Physical address
  lat: number|null             // Latitude coordinate
  lng: number|null             // Longitude coordinate
  businessId: string           // Business reference
  userUid: string              // Creator user ID
  fromEmprendeVerde: boolean   // EmprendeVerde platform flag
  createdAt: Timestamp         // Creation timestamp
  updatedAt: Timestamp|null    // Last update timestamp
  archivedAt: Timestamp|null   // Archive timestamp (soft delete)
```

### Orders (`pedido`)

Complete order management with product details and shipping information.

```javascript
pedido/{document-id}/
  products: Array<{            // Ordered products array
    productId: string          // Product reference
    productName: string        // Product name snapshot
    quantity: number           // Ordered quantity
    price: number              // Unit price at order time
    unit: string               // Unit of measurement
    total: number              // Line total (quantity × price)
    stockUsed: number          // Stock consumed
  }>
  client: {                    // Customer information snapshot
    clientName: string
    phone: string
    address: string|null
    fromEmprendeVerde?: boolean
    lat?: number
    lng?: number
  }
  clientId: string            // Client document reference
  businessId: string          // Business reference
  userUid: string             // Order creator
  shippingDate: Timestamp     // Scheduled delivery/pickup date
  shippingType: string|null   // "Envío", "Retiro en Local", or null
  shippingPrice: number       // Shipping cost
  totalAmount: number         // Grand total (products + shipping)
  totalProductsAmount: number // Products subtotal
  createdAt: Timestamp        // Order creation timestamp
  orderStatus: string         // Current order status
```

#### Order Status Tracking (`pedido/{orderId}/pedidoStatusLog`)

Maintains a complete audit trail of order status changes.

```javascript
pedido/{orderId}/pedidoStatusLog/{document-id}/
  orderStatus: string         // New status value
  message: string|null        // Optional status change notes
  createdAt: Timestamp        // Status change timestamp
  userUid: string             // User who changed the status
```

### Daily Cost Tracking (`dailyProductCost`)

Tracks historical cost data for financial analysis.

```javascript
dailyProductCost/{document-id}/
  productId: string           // Product reference
  productName: string         // Product name snapshot
  cost: number                // Daily cost per unit
  date: Timestamp             // Date for cost record
  businessId: string          // Business reference
  createdAt: Timestamp        // Record creation timestamp
  updatedAt: Timestamp|null   // Last update timestamp
```

### Stock Movements (`stockMovements`)

Comprehensive inventory movement tracking system.

```javascript
stockMovements/{document-id}/
  businessId: string           // Business reference
  productId: string            // Product reference
  productName: string          // Product name snapshot
  type: string                 // Movement type: "SALE", "RETURN", "ADDITION"
  quantity: number             // Movement quantity (negative for outbound)
  previousStock: number        // Stock level before movement
  newStock: number             // Stock level after movement
  previousCost: number         // Previous unit cost
  newCost: number              // New unit cost
  unitBuyingPrice: number|null // Purchase price (for additions)
  notes: string|null           // Additional movement notes
  orderId: string|null         // Associated order reference
  createdAt: Timestamp         // Movement timestamp
  userUid: string              // User who recorded the movement
```

### Suppliers (`suppliers`)

Supplier management for procurement tracking.

```javascript
suppliers/{document-id}/
  name: string                // Supplier company name
  businessId: string          // Business reference
  userUid: string             // User who added supplier
  createdAt: Timestamp        // Creation timestamp
```

### Client Recommendations (`clientRecommendations`)

AI-powered and manual customer recommendations system.

```javascript
clientRecommendations/{document-id}/
  clientId: string            // Target client reference
  recommendations: any        // Recommendation data structure
  createdAt: Timestamp        // Generation timestamp
  ordersAnalyzed: number      // Number of orders used for analysis
```

### Business & Employee Management (`userBusiness`)

Unified collection for businesses and their employees with role differentiation.

#### Business Records (`isEmployee: false`)

```javascript
userBusiness/{document-id}/
  name: string                // Business name
  phone: string|null          // Business contact phone
  description: string|null    // Business description
  address: string|null        // Business address
  imageUrl: string|null       // Business logo/image URL
  userBusinessImageId: string|null // Image document reference
  shippingPrice: number|null  // Default shipping price
  shippingType: string|null   // Default shipping method
  businessUrl: string|null    // Business website/URL
  isEmployee: false           // Business record flag
  userUid: string             // Business owner user ID
  createdAt: Timestamp        // Business creation timestamp
  updatedAt: Timestamp|null   // Last update timestamp
  archivedAt: Timestamp|null  // Archive timestamp (soft delete)
```

#### Employee Records (`isEmployee: true`)

```javascript
userBusiness/{document-id}/
  businessId: string          // Parent business reference
  employeeName: string        // Employee full name
  role: "Propietario"|"Empleado" // Employee role designation
  status: string              // Employment status
  code: string                // Employee invitation/access code
  userUid: string|null        // Employee user account (null if not accepted)
  acceptedAt: Timestamp|null  // Employment acceptance timestamp
  isEmployee: true            // Employee record flag
  createdAt: Timestamp        // Employee record creation
  updatedAt: Timestamp|null   // Last update timestamp
  archivedAt: Timestamp|null  // Archive timestamp (soft delete)
```

### Business Images (`userBusinessImage`)

Centralized image storage and management for businesses.

```javascript
userBusinessImage/{document-id}/
  imageUrl: string            // Public image URL
  imagePublicId: string       // Cloud storage public ID
  imageCompleteInfo: object   // Complete image metadata
  userUid: string             // User who uploaded the image
  businessId: string|false    // Business reference or false for unassigned
  createdAt: Timestamp        // Upload timestamp
  updatedAt: Timestamp|null   // Last update timestamp
  archivedAt: Timestamp|null  // Archive timestamp (soft delete)
```

### User Roles (`roles`)

Granular role-based access control system.

```javascript
roles/{document-id}/
  userUid: string             // User account reference
  businessId: string          // Business reference
  role: string                // Role type: "propietario" or "empleado"
  createdAt: Timestamp        // Role assignment timestamp
  updatedAt: Timestamp|null   // Last update timestamp
  archivedAt: Timestamp|null  // Archive timestamp (soft delete)
```

## Key Business Features

### Geographic Analysis

- Client location mapping for delivery route optimization
- Zone-based marketing and customer segmentation
- Geographic performance analytics

### Stock Forecasting

- Historical usage pattern analysis
- Predictive inventory recommendations
- Automated low-stock alerts

### Financial Tracking

- Real-time cost and revenue monitoring
- Profit margin analysis by product and period
- Comprehensive financial reporting

### Multi-Business Support

- Isolated data for each business
- Centralized user management across businesses
- Role-based access control per business

### Employee Management

- Hierarchical role system (Owner/Employee)
- Invitation-based employee onboarding
- Activity tracking and permissions management

## Security & Data Management

### Authentication

- Firebase Authentication integration
- Multi-factor authentication support
- Secure session management

### Data Isolation

- Business-level data segregation
- Role-based data access control
- Audit trails for all critical operations

### Backup & Recovery

- Automated Firestore backups
- Point-in-time recovery capabilities
- Data export functionality

## Project Structure & Page Architecture

### Frontend Architecture

The application follows a structured Nuxt 3 architecture with clear separation of concerns:

```
├── pages/                   # Route-based page components
├── components/              # Reusable UI components
├── stores/                  # Pinia state management
├── composables/             # Reusable composition functions
├── middleware/              # Route middleware (authentication)
├── layouts/                 # Page layout templates
├── plugins/                 # Third-party integrations
├── utils/                   # Utility functions
└── interfaces/              # TypeScript type definitions
```

### Page Structure & Navigation Flow

#### Authentication Flow

- **`pages/welcome.vue`** - Landing/login page for user authentication
- **`pages/negocios/index.vue`** - Business selection for multi-business users
- **`pages/empleados.vue`** - Employee access management and invitation system
- **`pages/blocked.vue`** - Access restriction page for unauthorized users

#### Dashboard & Overview

- **`pages/resumen/dashboard.vue`** - Main business dashboard
  - Key performance metrics display
  - Recent orders summary
  - Low stock alerts
  - Daily sales overview
  - Quick action buttons

#### Inventory Management

- **`pages/inventario/index.vue`** - Product catalog and inventory overview

  - Product list with search and filtering
  - Stock level indicators
  - Category-based organization
  - Bulk actions for products

- **`pages/inventario/nuevo.vue`** - Product creation and editing

  - Product information forms
  - Image upload functionality
  - Pricing and cost configuration
  - Category assignment

- **`pages/resumen/stock.vue`** - Stock analysis and forecasting

  - Stock level analytics
  - Usage pattern analysis
  - Reorder recommendations
  - Historical stock data

- **`pages/resumen/movimientos-stock.vue`** - Stock movement tracking
  - Movement history log
  - Stock adjustment forms
  - Supplier-based filtering
  - Cost impact analysis

#### Order Management System

- **`pages/pedidos/index.vue`** - Order list and management hub

  - Active and historical orders
  - Status-based filtering
  - Search functionality
  - Bulk order operations

- **`pages/pedidos/nuevo.vue`** - Order creation interface

  - Product selection with stock validation
  - Client assignment and management
  - Shipping option configuration
  - Real-time total calculation

- **`pages/pedidos/carrito.vue`** - Shopping cart functionality

  - Order item management
  - Quantity adjustments
  - Shipping calculations
  - Order review before confirmation

- **`pages/pedidos/confirmado.vue`** - Order confirmation page

  - Order summary display
  - Payment confirmation
  - Delivery scheduling
  - Order tracking information

- **`pages/pedidos/[orderId].vue`** - Detailed order view
  - Complete order information
  - Status tracking timeline
  - Delivery management
  - Order modification capabilities

#### Client Relationship Management

- **`pages/clientes/index.vue`** - Client database and list view

  - Client search and filtering
  - Geographic grouping options
  - Contact management
  - Client performance metrics

- **`pages/clientes/nuevo.vue`** - New client registration

  - Contact information forms
  - Address and location mapping
  - EmprendeVerde integration
  - Client categorization

- **`pages/clientes/[clientId].vue`** - Individual client profile

  - Complete client information
  - Order history analysis
  - Geographic location details
  - Personalized recommendations

- **`pages/resumen/map.vue`** - Geographic client distribution
  - Interactive map visualization
  - Client location clustering
  - Delivery route optimization
  - Zone-based analytics

### Component Architecture

#### Specialized Components

- **`components/business/BusinessNewAndUpdate.vue`** - Business profile management
- **`components/clients/ClientsDetails.vue`** - Client information display
- **`components/employee/EmployeeNewAndUpdate.vue`** - Employee management forms
- **`components/orders/OrdersDetails.vue`** - Order information display
- **`components/orders/OrdersStockDetails.vue`** - Stock impact analysis for orders
- **`components/products/ProductsDetails.vue`** - Product information display
- **`components/products/ProductsEditStock.vue`** - Stock editing interface

#### Utility Components

- **`components/Autocomplete.vue`** - Search and selection functionality
- **`components/ConfirmDialogue.vue`** - Action confirmation dialogs
- **`components/ModalStructure.vue`** - Reusable modal framework
- **`components/Loader.vue`** - Loading state indicators
- **`components/Tooltip.vue`** - Contextual help tooltips

### State Management (Pinia Stores)

The application uses Pinia for centralized state management with domain-specific stores:

- **`stores/products.ts`** - Product catalog and inventory state
- **`stores/clients.ts`** - Client database and relationship management
- **`stores/orders.ts`** - Order processing and status management
- **`stores/dashboard.ts`** - Dashboard metrics and analytics
- **`stores/stock.ts`** - Stock movement and level tracking
- **`stores/zones.ts`** - Geographic zone and delivery management

### Data Processing & Analytics

#### Scripts & Utilities

The `/scripts` directory contains specialized data processing tools:

- **Geographic Processing**: Client location analysis and zone mapping
- **Cost Analysis**: Daily product cost tracking and profit calculations
- **Migration Tools**: Database schema updates and data transformations
- **Report Generation**: Analytics and business intelligence reports
- **AI Integration**: Gemini AI for recommendations and insights

#### Key Processing Scripts

- `create-daily-product-ranking.js` - Product performance analytics
- `neighborhood-and-clients.js` - Geographic client distribution analysis
- `manage-cordoba-coordinates.js` - Location-based client mapping
- `reports/details-per-zone.js` - Zone-based performance reporting

### Integration & Plugins

#### Third-Party Integrations

- **`plugins/leafletMap.client.js`** - Interactive mapping functionality
- **`plugins/turf.client.js`** - Geospatial analysis capabilities
- **Firebase Integration** - Authentication, database, and storage
- **FormKit** - Advanced form handling and validation

#### Geographic Data

- **`public/barrios.json`** - Neighborhood boundary definitions
- **Zone Mapping** - Client-to-neighborhood assignment system
- **Delivery Optimization** - Route planning and geographic analytics

### User Experience Flow

1. **Authentication** → Business Selection → Role Assignment
2. **Dashboard** → Overview → Quick Actions → Detailed Views
3. **Order Processing** → Product Selection → Client Assignment → Confirmation
4. **Inventory Management** → Stock Monitoring → Reorder Alerts → Supplier Management
5. **Client Management** → Geographic Analysis → Targeted Marketing → Relationship Building
6. **Analytics** → Performance Metrics → Business Intelligence → Strategic Planning

This comprehensive architecture supports scalable business operations while maintaining clear separation between different functional areas, enabling efficient development and maintenance of the platform.

## Conclusion

This system provides a robust foundation for small business operations, combining modern web technologies with comprehensive business management features to support growth and operational efficiency.
