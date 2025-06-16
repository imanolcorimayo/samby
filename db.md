### producto

Stores product information for each business.

```
producto/
  {document-id}/
    productName: string           // Name of the product
    description: string|null      // Description of the product
    unit: string                 // Unit of measurement (e.g., kg, unidad)
    step: number                 // Step size for ordering
    price: number                // Sale price per unit
    category: string             // Product category
    isAvailable: boolean         // Whether the product is available for sale
    highlightProduct: boolean    // Whether the product is highlighted
    imageUrl: string|null        // URL to the product image
    productImageId: string|null  // Reference to the product image document
    productStock: number         // Current stock level
    cost: number                 // Cost per unit
    businessId: string           // Reference to the business
    userUid: string              // User who created/updated the product
    createdAt: Timestamp         // Creation date
    updatedAt: Timestamp|null    // Last update date
    archivedAt: Timestamp|null   // Archive date (if deleted)
```

### cliente

Stores client/customer information.

```
cliente/
  {document-id}/
    clientName: string           // Name of the client
    phone: string                // Phone number
    address: string|null         // Address
    lat: number|null             // Latitude
    lng: number|null             // Longitude
    businessId: string           // Reference to the business
    userUid: string              // User who created/updated the client
    fromEmprendeVerde: boolean   // Whether the client is from EmprendeVerde
    createdAt: Timestamp         // Creation date
    updatedAt: Timestamp|null    // Last update date
    archivedAt: Timestamp|null   // Archive date (if deleted)
```

### pedido

Stores order information.

```
pedido/
  {document-id}/
    products: Array<{            // List of products in the order
      productId: string
      productName: string
      quantity: number
      price: number
      unit: string
      total: number
      stockUsed: number
    }>
    client: {
      clientName: string
      phone: string
      address: string|null
      fromEmprendeVerde?: boolean
      lat?: number
      lng?: number
    }
    clientId: string            // Reference to the client
    businessId: string          // Reference to the business
    userUid: string             // User who created the order
    shippingDate: Timestamp     // Scheduled shipping date
    shippingType: string|null   // Shipping type ("Envío", "Retiro en Local", or null)
    shippingPrice: number       // Shipping price
    totalAmount: number         // Total order amount
    totalProductsAmount: number // Total amount for products
    createdAt: Timestamp        // Creation date
    orderStatus: string         // Status of the order
```

#### pedido/{orderId}/pedidoStatusLog

Tracks status changes for an order.

```
pedido/{orderId}/pedidoStatusLog/
  {document-id}/
    orderStatus: string         // Status of the order
    message: string|null        // Optional message
    createdAt: Timestamp        // When the status was set
    userUid: string             // User who set the status
```

### dailyProductCost

Tracks daily cost of products for each business.

```
dailyProductCost/
  {document-id}/
    productId: string           // Reference to the product
    productName: string         // Name of the product
    cost: number                // Cost per unit for the day
    date: Timestamp             // Date for the cost
    businessId: string          // Reference to the business
    createdAt: Timestamp        // Creation date
    updatedAt: Timestamp|null   // Last update date
```

### stockMovements

Comprehensive inventory movement tracking system for perishable goods.

```
stockMovements/
  {document-id}/
    businessId: string           // References the business this stock movement belongs to
    productId: string            // References the product involved in the movement
    productName: string          // Name of the product
    type: string                 // Type of movement (e.g., "SALE", "RETURN", "ADDITION")
    quantity: number             // Quantity of the movement (negative for sales)
    previousStock: number        // Stock level before the movement
    newStock: number             // Stock level after the movement
    previousCost: number         // Cost of the product before the movement
    newCost: number              // Cost of the product after the movement
    unitBuyingPrice: number|null // Unit buying price (for additions)
    notes: string|null           // Additional notes for the movement
    orderId: string|null         // References the order associated with the movement (if applicable)
    createdAt: Timestamp         // When the movement was created
    userUid: string              // User ID who created the movement
```

### suppliers

Stores supplier information for each business.

```
suppliers/
  {document-id}/
    name: string                // Supplier name
    businessId: string          // Reference to the business
    userUid: string             // User who created the supplier
    createdAt: Timestamp        // Creation date
```

### clientRecommendations

Stores AI or manual recommendations for clients.

```
clientRecommendations/
  {document-id}/
    clientId: string            // Reference to the client
    recommendations: any        // Recommendations data (structure may vary)
    createdAt: Timestamp        // Creation date
    ordersAnalyzed: number      // Number of orders analyzed for recommendations
```

### userBusiness

Stores business and employee records. Each document represents either a business (isEmployee: false) or an employee (isEmployee: true) associated with a business.

```
userBusiness/
  {document-id}/
    // For business (isEmployee: false):
    name: string
    phone: string|null
    description: string|null
    address: string|null
    imageUrl: string|null
    userBusinessImageId: string|null
    shippingPrice: number|null
    shippingType: string|null
    businessUrl: string|null
    isEmployee: false
    userUid: string
    createdAt: Timestamp
    updatedAt: Timestamp|null
    archivedAt: Timestamp|null

    // For employee (isEmployee: true):
    businessId: string
    employeeName: string
    role: "Propietario"|"Empleado"
    status: string
    code: string
    userUid: string|null
    acceptedAt: Timestamp|null
    isEmployee: true
    createdAt: Timestamp
    updatedAt: Timestamp|null
    archivedAt: Timestamp|null
```

### userBusinessImage

Stores images associated with businesses.

```
userBusinessImage/
  {document-id}/
    imageUrl: string
    imagePublicId: string
    imageCompleteInfo: object
    userUid: string
    businessId: string|false
    createdAt: Timestamp
    updatedAt: Timestamp|null
    archivedAt: Timestamp|null
```

### roles

Stores user roles for each business.

```
roles/
  {document-id}/
    userUid: string
    businessId: string
    role: string // "propietario" or "empleado"
    createdAt: Timestamp
    updatedAt: Timestamp|null
    archivedAt: Timestamp|null
```
